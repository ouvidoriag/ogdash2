/**
 * Script de Mapeamento ULTRA DETALHADO do Sistema
 * 
 * Analisa TUDO:
 * - Schemas do banco de dados (Prisma)
 * - Sistemas de cache (banco + memória + localStorage)
 * - Utilitários e pipelines
 * - TODAS as páginas com contexto completo
 * - Fluxos de dados
 * - Dependências entre sistemas
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_DIR = path.join(__dirname, '..');
const PAGES_DIR = path.join(BASE_DIR, 'public', 'scripts', 'pages');
const CORE_DIR = path.join(BASE_DIR, 'public', 'scripts', 'core');
const CONTROLLERS_DIR = path.join(BASE_DIR, 'src', 'api', 'controllers');
const UTILS_DIR = path.join(BASE_DIR, 'src', 'utils');
const PIPELINES_DIR = path.join(BASE_DIR, 'src', 'utils', 'pipelines');
const SCHEMA_FILE = path.join(BASE_DIR, 'prisma', 'schema.prisma');
const HTML_FILE = path.join(BASE_DIR, 'public', 'index.html');
const OUTPUT_DIR = path.join(__dirname);

const mapping = {
  database: {
    models: [],
    fields: [],
    indexes: []
  },
  cache: {
    systems: [],
    strategies: []
  },
  pages: [],
  globalSystems: [],
  apis: [],
  utils: [],
  pipelines: [],
  htmlElements: {}
};

/**
 * Analisar schema do Prisma
 */
function analyzePrismaSchema() {
  if (!fs.existsSync(SCHEMA_FILE)) {
    console.warn('Schema Prisma não encontrado');
    return;
  }
  
  const content = fs.readFileSync(SCHEMA_FILE, 'utf-8');
  
  // Extrair models
  const modelPattern = /model\s+(\w+)\s*\{([\s\S]*?)\n\}/g;
  let match;
  
  while ((match = modelPattern.exec(content)) !== null) {
    const modelName = match[1];
    const modelContent = match[2];
    
    const model = {
      name: modelName,
      table: null,
      fields: [],
      indexes: [],
      relations: []
    };
    
    // Extrair nome da tabela (@@map)
    const mapMatch = modelContent.match(/@@map\(['"]([^'"]+)['"]\)/);
    if (mapMatch) {
      model.table = mapMatch[1];
    }
    
    // Extrair campos
    const fieldPattern = /(\w+)\s+(\w+[?]?)\s*(@[^\n]+)?/g;
    let fieldMatch;
    while ((fieldMatch = fieldPattern.exec(modelContent)) !== null) {
      const fieldName = fieldMatch[1];
      const fieldType = fieldMatch[2];
      const attributes = fieldMatch[3] || '';
      
      const field = {
        name: fieldName,
        type: fieldType,
        optional: fieldType.includes('?'),
        isId: attributes.includes('@id'),
        isUnique: attributes.includes('@unique'),
        isIndexed: false,
        defaultValue: null,
        comment: null
      };
      
      // Extrair comentário
      const commentMatch = modelContent.substring(0, fieldMatch.index).match(/\/\/\s*(.+)$/m);
      if (commentMatch) {
        field.comment = commentMatch[1].trim();
      }
      
      // Extrair default
      const defaultMatch = attributes.match(/@default\(([^)]+)\)/);
      if (defaultMatch) {
        field.defaultValue = defaultMatch[1];
      }
      
      model.fields.push(field);
    }
    
    // Extrair índices
    const indexPattern = /@@index\(\[([^\]]+)\]\)/g;
    while ((match = indexPattern.exec(modelContent)) !== null) {
      const indexFields = match[1].split(',').map(f => f.trim().replace(/['"]/g, ''));
      model.indexes.push({
        fields: indexFields,
        type: indexFields.length > 1 ? 'compound' : 'simple'
      });
      
      // Marcar campos como indexados
      indexFields.forEach(fieldName => {
        const field = model.fields.find(f => f.name === fieldName);
        if (field) {
          field.isIndexed = true;
        }
      });
    }
    
    mapping.database.models.push(model);
    mapping.database.fields.push(...model.fields.map(f => ({
      ...f,
      model: modelName
    })));
    mapping.database.indexes.push(...model.indexes.map(idx => ({
      ...idx,
      model: modelName
    })));
  }
}

/**
 * Analisar sistemas de cache
 */
function analyzeCacheSystems() {
  // dbCache.js
  const dbCacheFile = path.join(UTILS_DIR, 'dbCache.js');
  if (fs.existsSync(dbCacheFile)) {
    const content = fs.readFileSync(dbCacheFile, 'utf-8');
    const functions = [];
    const funcPattern = /^(export\s+)?(async\s+)?function\s+(\w+)/gm;
    let match;
    while ((match = funcPattern.exec(content)) !== null) {
      functions.push(match[3] || match[2]);
    }
    
    mapping.cache.systems.push({
      name: 'dbCache',
      type: 'Database Cache',
      description: 'Cache de agregações no MongoDB (model AggregationCache)',
      file: 'dbCache.js',
      functions: functions,
      storage: 'MongoDB',
      ttl: 'Configurável por chave',
      invalidation: 'Automática por expiresAt'
    });
  }
  
  // smartCache.js
  const smartCacheFile = path.join(UTILS_DIR, 'smartCache.js');
  if (fs.existsSync(smartCacheFile)) {
    const content = fs.readFileSync(smartCacheFile, 'utf-8');
    const functions = [];
    const funcPattern = /^(export\s+)?(async\s+)?function\s+(\w+)/gm;
    let match;
    while ((match = funcPattern.exec(content)) !== null) {
      functions.push(match[3] || match[2]);
    }
    
    // Extrair TTLs por endpoint
    const ttlPattern = /case\s+['"]([^'"]+)['"]:\s*return\s+(\d+)/g;
    const ttls = {};
    let ttlMatch;
    while ((ttlMatch = ttlPattern.exec(content)) !== null) {
      ttls[ttlMatch[1]] = parseInt(ttlMatch[2]);
    }
    
    mapping.cache.systems.push({
      name: 'smartCache',
      type: 'Smart Cache',
      description: 'Cache inteligente com TTL adaptativo por tipo de endpoint',
      file: 'smartCache.js',
      functions: functions,
      storage: 'MongoDB (AggregationCache)',
      ttls: ttls,
      invalidation: 'Por padrão de chave'
    });
  }
  
  // responseHelper.js (withCache)
  const responseHelperFile = path.join(UTILS_DIR, 'responseHelper.js');
  if (fs.existsSync(responseHelperFile)) {
    const content = fs.readFileSync(responseHelperFile, 'utf-8');
    
    mapping.cache.systems.push({
      name: 'withCache',
      type: 'Response Cache Wrapper',
      description: 'Wrapper para endpoints com cache no banco + memória + timeout',
      file: 'responseHelper.js',
      storage: 'Híbrido (MongoDB + Memória)',
      features: ['Timeout configurável', 'Fallback em memória', 'Tratamento de erros']
    });
  }
  
  // global-store.js (dataStore)
  const globalStoreFile = path.join(CORE_DIR, 'global-store.js');
  if (fs.existsSync(globalStoreFile)) {
    const content = fs.readFileSync(globalStoreFile, 'utf-8');
    
    // Verificar se usa localStorage
    const usesLocalStorage = content.includes('localStorage');
    const usesPersistent = content.includes('setPersistent') || content.includes('getPersistent');
    
    mapping.cache.systems.push({
      name: 'dataStore',
      type: 'Client-Side Cache',
      description: 'Cache no cliente com localStorage e reatividade',
      file: 'global-store.js',
      storage: usesLocalStorage ? 'localStorage + Memória' : 'Memória',
      features: ['TTL por chave', 'Deep copy', 'Listeners/Reatividade', usesPersistent ? 'Persistência' : null].filter(Boolean)
    });
  }
  
  // dataLoader.js
  const dataLoaderFile = path.join(CORE_DIR, 'dataLoader.js');
  if (fs.existsSync(dataLoaderFile)) {
    const content = fs.readFileSync(dataLoaderFile, 'utf-8');
    
    // Extrair timeouts adaptativos
    const timeoutPattern = /case\s+['"]([^'"]+)['"]:\s*return\s+(\d+)/g;
    const timeouts = {};
    let timeoutMatch;
    while ((timeoutMatch = timeoutPattern.exec(content)) !== null) {
      timeouts[timeoutMatch[1]] = parseInt(timeoutMatch[2]);
    }
    
    mapping.cache.systems.push({
      name: 'dataLoader',
      type: 'Data Loader',
      description: 'Sistema de carregamento com cache, deduplicação e timeouts adaptativos',
      file: 'dataLoader.js',
      storage: 'Integrado com dataStore',
      features: ['Deduplicação', 'Retry com backoff', 'Timeouts adaptativos', 'Fila de prioridades'],
      timeouts: timeouts
    });
  }
}

/**
 * Analisar utilitários
 */
function analyzeUtils() {
  if (!fs.existsSync(UTILS_DIR)) return;
  
  const files = fs.readdirSync(UTILS_DIR);
  
  files.forEach(file => {
    if (file.endsWith('.js') && !file.includes('test')) {
      const filePath = path.join(UTILS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      const functions = [];
      const funcPattern = /^(export\s+)?(async\s+)?function\s+(\w+)/gm;
      let match;
      while ((match = funcPattern.exec(content)) !== null) {
        functions.push(match[3] || match[2]);
      }
      
      // Extrair métodos de objeto
      const methodPattern = /(\w+)\s*[:=]\s*(async\s+)?(function|\([^)]*\)\s*=>)/g;
      while ((match = methodPattern.exec(content)) !== null) {
        if (!functions.includes(match[1])) {
          functions.push(match[1]);
        }
      }
      
      // Extrair descrição do comentário inicial
      const descMatch = content.match(/\/\*\*[\s\S]*?\*\//);
      const description = descMatch ? descMatch[0].replace(/\*/g, '').substring(0, 200) : '';
      
      mapping.utils.push({
        name: file.replace('.js', ''),
        file: file,
        path: path.relative(BASE_DIR, filePath),
        functions: functions.slice(0, 30),
        description: description.substring(0, 150)
      });
    }
  });
}

/**
 * Analisar pipelines MongoDB
 */
function analyzePipelines() {
  if (!fs.existsSync(PIPELINES_DIR)) return;
  
  const files = fs.readdirSync(PIPELINES_DIR);
  
  files.forEach(file => {
    if (file.endsWith('.js') && file !== 'index.js') {
      const filePath = path.join(PIPELINES_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      const pipelines = [];
      const pipelinePattern = /(export\s+)?(function\s+)?build(\w+)Pipeline/g;
      let match;
      while ((match = pipelinePattern.exec(content)) !== null) {
        pipelines.push(match[3] || match[2]);
      }
      
      // Extrair estágios do pipeline
      const stagePattern = /\$(\w+):/g;
      const stages = new Set();
      while ((match = stagePattern.exec(content)) !== null) {
        stages.add(match[1]);
      }
      
      mapping.pipelines.push({
        name: file.replace('.js', ''),
        file: file,
        pipelines: pipelines,
        stages: Array.from(stages),
        path: path.relative(BASE_DIR, filePath)
      });
    }
  });
}

/**
 * Analisar página com MÁXIMO detalhe
 */
function analyzePageUltraDetailed(filePath, type) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(BASE_DIR, filePath);
  const pageName = path.basename(filePath, '.js');
  
  const info = {
    name: pageName,
    path: relativePath,
    type: type,
    apis: [],
    charts: [],
    cards: [],
    kpis: [],
    filters: [],
    globalSystems: [],
    functions: [],
    dataFlow: [],
    cacheUsage: [],
    dependencies: [],
    description: ''
  };
  
  // Descrição
  const descMatch = content.match(/\/\*\*[\s\S]*?Página:[\s\S]*?\*\//);
  if (descMatch) {
    info.description = descMatch[0].replace(/\*\//g, '').replace(/\/\*\*/g, '').trim();
  }
  
  // APIs com contexto completo
  const apiPatterns = [
    { pattern: /window\.dataLoader\?\.load\(['"]([^'"]+)['"]/g, type: 'dataLoader' },
    { pattern: /fetch\(['"]([^'"]+)['"]/g, type: 'fetch' }
  ];
  
  apiPatterns.forEach(({ pattern, type: apiType }) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const api = match[1];
      if (api && api.startsWith('/api/')) {
        const beforeMatch = content.substring(Math.max(0, match.index - 200), match.index);
        const afterMatch = content.substring(match.index, Math.min(content.length, match.index + 300));
        
        // Variável que recebe
        const varMatch = beforeMatch.match(/(\w+)\s*=\s*(?:await\s+)?(?:window\.dataLoader|fetch)/);
        const varName = varMatch ? varMatch[1] : null;
        
        // Opções de cache
        const cacheMatch = afterMatch.match(/useDataStore:\s*(\w+)/);
        const ttlMatch = afterMatch.match(/ttl:\s*(\d+)/);
        
        // Como é usado depois
        const usageMatch = content.substring(match.index, Math.min(content.length, match.index + 1000))
          .match(new RegExp(`${varName || 'data'}\\.(\\w+)`, 'g'));
        const usage = usageMatch ? [...new Set(usageMatch.map(u => u.split('.')[1]))] : [];
        
        info.apis.push({
          url: api,
          type: apiType,
          variable: varName,
          usesCache: cacheMatch ? cacheMatch[1] === 'true' : null,
          ttl: ttlMatch ? parseInt(ttlMatch[1]) : null,
          usage: usage.slice(0, 10),
          context: afterMatch.substring(0, 150).replace(/\n/g, ' ').trim()
        });
        
        info.dataFlow.push({
          source: 'API',
          endpoint: api,
          variable: varName,
          usage: usage
        });
        
        if (cacheMatch || ttlMatch) {
          info.cacheUsage.push({
            type: 'API Cache',
            endpoint: api,
            variable: varName,
            ttl: ttlMatch ? parseInt(ttlMatch[1]) : null,
            useDataStore: cacheMatch ? cacheMatch[1] === 'true' : false
          });
        }
      }
    }
  });
  
  // Gráficos com dados completos
  const chartPatterns = [
    { pattern: /createBarChart\(['"]([^'"]+)['"]/g, type: 'bar' },
    { pattern: /createLineChart\(['"]([^'"]+)['"]/g, type: 'line' },
    { pattern: /createDoughnutChart\(['"]([^'"]+)['"]/g, type: 'doughnut' },
    { pattern: /createPieChart\(['"]([^'"]+)['"]/g, type: 'pie' }
  ];
  
  chartPatterns.forEach(({ pattern, type: chartType }) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const chartId = match[1];
      const afterMatch = content.substring(match.index, Math.min(content.length, match.index + 500));
      
      // Dados usados
      const dataMatch = afterMatch.match(/(\w+)(?:\.\w+)*\s*[,\)]/);
      const dataVar = dataMatch ? dataMatch[1] : null;
      
      // Labels
      const labelsMatch = afterMatch.match(/(\w+)(?:\.\w+)*\s*[,\)]/);
      
      // Opções (onClick, etc)
      const onClickMatch = afterMatch.match(/onClick:\s*(\w+)/);
      
      info.charts.push({
        id: chartId,
        type: chartType,
        dataVariable: dataVar,
        hasOnClick: onClickMatch ? onClickMatch[1] === 'true' : false,
        context: afterMatch.substring(0, 200).replace(/\n/g, ' ').trim()
      });
    }
  });
  
  // KPIs e Cards com fontes
  const kpiPattern = /getElementById\(['"](kpi\w+)['"]\)/g;
  let match;
  while ((match = kpiPattern.exec(content)) !== null) {
    const kpiId = match[1];
    if (!info.kpis.includes(kpiId)) {
      info.kpis.push(kpiId);
      
      // Encontrar de onde vem o valor
      const afterMatch = content.substring(match.index, Math.min(content.length, match.index + 500));
      const valueMatch = afterMatch.match(/\.(?:textContent|innerHTML)\s*=\s*([^;]+)/);
      const valueSource = valueMatch ? valueMatch[1].trim() : null;
      
      // Tentar encontrar variável de dados
      const dataVarMatch = valueSource ? valueSource.match(/(\w+)\.\w+/) : null;
      const dataVar = dataVarMatch ? dataVarMatch[1] : null;
      
      info.cards.push({
        id: kpiId,
        type: 'KPI',
        valueSource: valueSource,
        dataVariable: dataVar
      });
    }
  }
  
  // Filtros
  const filterPattern = /getElementById\(['"](filtro\w+|select\w+)['"]\)/g;
  while ((match = filterPattern.exec(content)) !== null) {
    const filterId = match[1];
    if (!info.filters.includes(filterId)) {
      info.filters.push(filterId);
    }
  }
  
  // Sistemas globais com uso
  const globalPatterns = [
    { pattern: /window\.dataLoader/g, name: 'dataLoader' },
    { pattern: /window\.dataStore/g, name: 'dataStore' },
    { pattern: /window\.chartFactory/g, name: 'chartFactory' },
    { pattern: /window\.chartCommunication/g, name: 'chartCommunication' },
    { pattern: /window\.Logger/g, name: 'Logger' },
    { pattern: /window\.dateUtils/g, name: 'dateUtils' },
    { pattern: /window\.config/g, name: 'config' },
    { pattern: /window\.advancedCharts/g, name: 'advancedCharts' }
  ];
  
  globalPatterns.forEach(({ pattern, name }) => {
    if (pattern.test(content)) {
      // Contar usos
      const uses = (content.match(pattern) || []).length;
      info.globalSystems.push({ name, uses });
    }
  });
  
  // Funções principais
  const functionPattern = /^(async\s+)?function\s+(\w+)/gm;
  while ((match = functionPattern.exec(content)) !== null) {
    if (!info.functions.includes(match[2])) {
      info.functions.push(match[2]);
    }
  }
  
  // Dependências (imports)
  const importPattern = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
  while ((match = importPattern.exec(content)) !== null) {
    if (!info.dependencies.includes(match[1])) {
      info.dependencies.push(match[1]);
    }
  }
  
  return info;
}

/**
 * Analisar HTML completo
 */
function analyzeHTMLComplete() {
  if (!fs.existsSync(HTML_FILE)) return;
  
  const content = fs.readFileSync(HTML_FILE, 'utf-8');
  
  // Extrair todas as seções
  const pagePattern = /<section[^>]*id=['"]page-([^'"]+)['"][^>]*>([\s\S]*?)<\/section>/g;
  let match;
  
  while ((match = pagePattern.exec(content)) !== null) {
    const pageId = match[1];
    const pageContent = match[2];
    
    const elements = {
      kpis: [],
      charts: [],
      cards: [],
      filters: [],
      buttons: [],
      inputs: [],
      tables: []
    };
    
    // KPIs
    const kpiPattern = /id=['"](kpi\w+)['"]/g;
    let kpiMatch;
    while ((kpiMatch = kpiPattern.exec(pageContent)) !== null) {
      elements.kpis.push(kpiMatch[1]);
    }
    
    // Gráficos
    const canvasPattern = /id=['"](chart\w+|canvas\w+)['"]/g;
    let canvasMatch;
    while ((canvasMatch = canvasPattern.exec(pageContent)) !== null) {
      elements.charts.push(canvasMatch[1]);
    }
    
    // Cards (glass)
    const cardPattern = /class=['"][^'"]*glass[^'"]*['"][^>]*>[\s\S]*?id=['"]([^'"]+)['"]/g;
    let cardMatch;
    while ((cardMatch = cardPattern.exec(pageContent)) !== null) {
      if (cardMatch[1] && !elements.cards.includes(cardMatch[1])) {
        elements.cards.push(cardMatch[1]);
      }
    }
    
    // Filtros
    const filterPattern = /id=['"](filtro\w+|select\w+)['"]/g;
    let filterMatch;
    while ((filterMatch = filterPattern.exec(pageContent)) !== null) {
      elements.filters.push(filterMatch[1]);
    }
    
    // Botões
    const buttonPattern = /id=['"](btn\w+|button\w+)['"]/g;
    let buttonMatch;
    while ((buttonMatch = buttonPattern.exec(pageContent)) !== null) {
      elements.buttons.push(buttonMatch[1]);
    }
    
    // Inputs
    const inputPattern = /id=['"](input\w+|search\w+)['"]/g;
    let inputMatch;
    while ((inputMatch = inputPattern.exec(pageContent)) !== null) {
      elements.inputs.push(inputMatch[1]);
    }
    
    // Tabelas
    const tablePattern = /id=['"](table\w+)['"]/g;
    let tableMatch;
    while ((tableMatch = tablePattern.exec(pageContent)) !== null) {
      elements.tables.push(tableMatch[1]);
    }
    
    mapping.htmlElements[pageId] = elements;
  }
}

/**
 * Gerar documentação ULTRA detalhada
 */
function generateUltraDetailedDocumentation() {
  let md = `# 🗺️ MAPEAMENTO ULTRA DETALHADO E COMPLETO DO SISTEMA

**Data de Geração**: ${new Date().toLocaleString('pt-BR')}
**Versão**: 3.0 - ULTRA DETALHADO
**Análise Completa**: Banco de Dados, Cache, Utilitários, Pipelines, Páginas, APIs, Sistemas Globais

---

## 📋 ÍNDICE COMPLETO

1. [Banco de Dados - Schemas Prisma](#banco-de-dados)
2. [Sistemas de Cache](#sistemas-de-cache)
3. [Utilitários e Helpers](#utilitários-e-helpers)
4. [Pipelines MongoDB](#pipelines-mongodb)
5. [Sistemas Globais Detalhados](#sistemas-globais-detalhados)
6. [APIs e Controllers Completos](#apis-e-controllers-completos)
7. [Páginas com Análise Ultra Detalhada](#páginas-com-análise-ultra-detalhada)
8. [Elementos HTML Mapeados](#elementos-html-mapeados)
9. [Fluxos de Dados](#fluxos-de-dados)
10. [Resumo e Estatísticas](#resumo-e-estatísticas)

---

## 🗄️ BANCO DE DADOS

### **Provider**: MongoDB
### **ORM**: Prisma
### **Total de Models**: ${mapping.database.models.length}

`;

  // Models do banco
  mapping.database.models.forEach(model => {
    md += `### **Model: ${model.name}**

**Tabela MongoDB**: \`${model.table || model.name.toLowerCase()}\`

**Campos** (${model.fields.length}):
`;
    model.fields.forEach(field => {
      md += `- **\`${field.name}\`** (\`${field.type}\`)`;
      if (field.isId) md += ` - 🔑 Primary Key`;
      if (field.isUnique) md += ` - ⭐ Unique`;
      if (field.isIndexed) md += ` - 📇 Indexed`;
      if (field.comment) md += ` - ${field.comment}`;
      md += `\n`;
    });
    
    md += `\n**Índices** (${model.indexes.length}):\n`;
    model.indexes.forEach(index => {
      md += `- **${index.type === 'compound' ? 'Compound' : 'Simple'}**: [${index.fields.join(', ')}]\n`;
    });
    
    md += `\n---\n\n`;
  });

  md += `## 💾 SISTEMAS DE CACHE

**Total de Sistemas**: ${mapping.cache.systems.length}

`;

  mapping.cache.systems.forEach(cache => {
    md += `### **${cache.name}** - ${cache.type}

**Arquivo**: \`${cache.file || 'N/A'}\`
**Descrição**: ${cache.description}
**Armazenamento**: ${cache.storage || 'N/A'}

`;
    if (cache.functions) {
      md += `**Funções** (${cache.functions.length}):\n`;
      cache.functions.forEach(func => {
        md += `- \`${func}()\`\n`;
      });
      md += `\n`;
    }
    
    if (cache.ttls) {
      md += `**TTLs por Endpoint**:\n`;
      Object.entries(cache.ttls).forEach(([endpoint, ttl]) => {
        md += `- \`${endpoint}\`: ${ttl}s (${Math.round(ttl / 60)}min)\n`;
      });
      md += `\n`;
    }
    
    if (cache.features) {
      md += `**Recursos**: ${cache.features.join(', ')}\n\n`;
    }
    
    md += `---\n\n`;
  });

  md += `## 🛠️ UTILITÁRIOS E HELPERS

**Total de Utilitários**: ${mapping.utils.length}

`;

  mapping.utils.forEach(util => {
    md += `### **${util.name}**

**Arquivo**: \`${util.path}\`
**Descrição**: ${util.description || 'Sem descrição'}

**Funções** (${util.functions.length}):
`;
    util.functions.forEach(func => {
      md += `- \`${func}()\`\n`;
    });
    md += `\n---\n\n`;
  });

  md += `## 🔄 PIPELINES MONGODB

**Total de Pipelines**: ${mapping.pipelines.length}

`;

  mapping.pipelines.forEach(pipeline => {
    md += `### **${pipeline.name}**

**Arquivo**: \`${pipeline.path}\`

**Pipelines Disponíveis**:
`;
    pipeline.pipelines.forEach(p => {
      md += `- \`build${p}Pipeline()\`\n`;
    });
    
    md += `\n**Estágios MongoDB Usados**: ${pipeline.stages.join(', ')}\n\n---\n\n`;
  });

  md += `## 🔧 SISTEMAS GLOBAIS DETALHADOS

`;

  // Sistemas globais (já mapeados anteriormente, adicionar mais detalhes)
  mapping.globalSystems.forEach(system => {
    md += `### **${system.name}** - \`${system.api}\`

**Arquivo**: \`${system.path}\`
**Descrição**: ${system.description}

**Funções e Métodos** (${system.functions.length}):
`;
    system.functions.forEach(func => {
      md += `- \`${func}()\`\n`;
    });
    md += `\n---\n\n`;
  });

  md += `## 🌐 APIs E CONTROLLERS COMPLETOS

`;

  mapping.apis.forEach(api => {
    md += `### **${api.controller}**

**Arquivo**: \`${api.path}\`

**Endpoints** (${api.endpoints.length}):
`;
    api.endpoints.forEach(endpoint => {
      md += `#### \`${endpoint.name}()\`
- **Método**: ${endpoint.method}
- **Rota**: ${endpoint.route || 'N/A'}
- **Documentação**: ${endpoint.documentation.substring(0, 200)}...

`;
    });
    md += `---\n\n`;
  });

  md += `## 📄 PÁGINAS COM ANÁLISE ULTRA DETALHADA

`;

  // Agrupar por tipo
  const pagesByType = {};
  mapping.pages.forEach(page => {
    if (!pagesByType[page.type]) {
      pagesByType[page.type] = [];
    }
    pagesByType[page.type].push(page);
  });

  Object.keys(pagesByType).forEach(type => {
    md += `### 📁 ${type.toUpperCase()}\n\n`;
    
    pagesByType[type].forEach(page => {
      md += `#### 📊 **${page.name}**

**Arquivo**: \`${page.path}\`
**Descrição**: ${page.description || 'Sem descrição'}

`;

      // APIs com detalhes completos
      if (page.apis.length > 0) {
        md += `**APIs Utilizadas** (${page.apis.length}):\n\n`;
        page.apis.forEach(api => {
          md += `- **\`${api.url}\`**\n`;
          md += `  - Tipo: ${api.type}\n`;
          md += `  - Variável: \`${api.variable || 'N/A'}\`\n`;
          if (api.usesCache !== null) {
            md += `  - Cache: ${api.usesCache ? '✅ Sim' : '❌ Não'}\n`;
          }
          if (api.ttl) {
            md += `  - TTL: ${api.ttl}ms (${Math.round(api.ttl / 1000)}s)\n`;
          }
          if (api.usage.length > 0) {
            md += `  - Uso: ${api.usage.join(', ')}\n`;
          }
          md += `  - Contexto: ${api.context}\n\n`;
        });
      }

      // Gráficos
      if (page.charts.length > 0) {
        md += `**Gráficos** (${page.charts.length}):\n\n`;
        page.charts.forEach(chart => {
          md += `- **\`${chart.id}\`** (${chart.type})\n`;
          md += `  - Dados: \`${chart.dataVariable || 'N/A'}\`\n`;
          md += `  - Interativo: ${chart.hasOnClick ? '✅ Sim' : '❌ Não'}\n`;
          md += `  - Contexto: ${chart.context.substring(0, 100)}...\n\n`;
        });
      }

      // KPIs e Cards
      if (page.kpis.length > 0 || page.cards.length > 0) {
        md += `**KPIs e Cards** (${page.kpis.length + page.cards.length}):\n\n`;
        page.kpis.forEach(kpi => {
          md += `- **\`${kpi}\`** (KPI)\n`;
        });
        page.cards.forEach(card => {
          md += `- **\`${card.id}\`** (${card.type})\n`;
          if (card.valueSource) {
            md += `  - Fonte: \`${card.valueSource}\`\n`;
          }
          if (card.dataVariable) {
            md += `  - Variável de dados: \`${card.dataVariable}\`\n`;
          }
        });
        md += `\n`;
      }

      // Filtros
      if (page.filters.length > 0) {
        md += `**Filtros** (${page.filters.length}): ${page.filters.join(', ')}\n\n`;
      }

      // Sistemas Globais
      if (page.globalSystems.length > 0) {
        md += `**Sistemas Globais Usados**:\n`;
        page.globalSystems.forEach(sys => {
          md += `- \`${sys.name}\`: ${sys.uses} uso(s)\n`;
        });
        md += `\n`;
      }

      // Cache Usage
      if (page.cacheUsage.length > 0) {
        md += `**Uso de Cache**:\n`;
        page.cacheUsage.forEach(cache => {
          md += `- \`${cache.endpoint}\`: ${cache.useDataStore ? 'dataStore' : 'sem cache'}`;
          if (cache.ttl) {
            md += ` (TTL: ${cache.ttl}ms)`;
          }
          md += `\n`;
        });
        md += `\n`;
      }

      // Fluxo de Dados
      if (page.dataFlow.length > 0) {
        md += `**Fluxo de Dados**:\n`;
        page.dataFlow.forEach(flow => {
          md += `- ${flow.source}: \`${flow.endpoint}\` → \`${flow.variable}\` → [${flow.usage.join(', ')}]\n`;
        });
        md += `\n`;
      }

      // Dependências
      if (page.dependencies.length > 0) {
        md += `**Dependências**: ${page.dependencies.slice(0, 10).join(', ')}${page.dependencies.length > 10 ? '...' : ''}\n\n`;
      }

      // Funções principais
      if (page.functions.length > 0) {
        md += `**Funções Principais** (${page.functions.length}):\n`;
        page.functions.slice(0, 15).forEach(func => {
          md += `- \`${func}()\`\n`;
        });
        md += `\n`;
      }

      md += `---\n\n`;
    });
  });

  md += `## 🏗️ ELEMENTOS HTML MAPEADOS

`;

  Object.keys(mapping.htmlElements).forEach(pageId => {
    const elements = mapping.htmlElements[pageId];
    md += `### **${pageId}**

- **KPIs**: ${elements.kpis.length} (${elements.kpis.slice(0, 10).join(', ')}${elements.kpis.length > 10 ? '...' : ''})
- **Gráficos**: ${elements.charts.length} (${elements.charts.slice(0, 10).join(', ')}${elements.charts.length > 10 ? '...' : ''})
- **Cards**: ${elements.cards.length}
- **Filtros**: ${elements.filters.length} (${elements.filters.slice(0, 10).join(', ')}${elements.filters.length > 10 ? '...' : ''})
- **Botões**: ${elements.buttons.length}
- **Inputs**: ${elements.inputs.length}
- **Tabelas**: ${elements.tables.length}

`;
  });

  md += `---

## 📊 RESUMO E ESTATÍSTICAS COMPLETAS

### Banco de Dados:
- **Models**: ${mapping.database.models.length}
- **Campos Totais**: ${mapping.database.fields.length}
- **Índices Totais**: ${mapping.database.indexes.length}

### Cache:
- **Sistemas de Cache**: ${mapping.cache.systems.length}
- **Estratégias**: Híbrido (MongoDB + Memória + localStorage)

### Utilitários:
- **Total**: ${mapping.utils.length}

### Pipelines:
- **Total**: ${mapping.pipelines.length}

### Páginas:
- **Total Analisadas**: ${mapping.pages.length}
- **Total de APIs**: ${mapping.pages.reduce((sum, p) => sum + p.apis.length, 0)}
- **Total de Gráficos**: ${mapping.pages.reduce((sum, p) => sum + p.charts.length, 0)}
- **Total de KPIs/Cards**: ${mapping.pages.reduce((sum, p) => sum + p.kpis.length + p.cards.length, 0)}
- **Total de Filtros**: ${mapping.pages.reduce((sum, p) => sum + p.filters.length, 0)}

### HTML:
- **Páginas Mapeadas**: ${Object.keys(mapping.htmlElements).length}

---

## 📝 NOTAS IMPORTANTES

1. **Este mapeamento foi gerado automaticamente** pelo script \`map-ultra-detailed.js\`
2. **Para atualizar**: Execute \`node maps/map-ultra-detailed.js\`
3. **Banco de Dados**: MongoDB com Prisma ORM
4. **Cache**: Sistema híbrido (banco + memória + localStorage)
5. **Pipelines**: Agregações MongoDB otimizadas
6. **Sistemas Globais**: 8 sistemas principais integrados

---

**Fim do Mapeamento Ultra Detalhado**
`;

  return md;
}

/**
 * Executar
 */
function main() {
  console.log('🗺️ Iniciando mapeamento ULTRA detalhado...\n');
  
  console.log('🗄️ Analisando schema do Prisma...');
  analyzePrismaSchema();
  
  console.log('💾 Analisando sistemas de cache...');
  analyzeCacheSystems();
  
  console.log('🛠️ Analisando utilitários...');
  analyzeUtils();
  
  console.log('🔄 Analisando pipelines MongoDB...');
  analyzePipelines();
  
  console.log('📄 Analisando páginas (ultra detalhado)...');
  if (fs.existsSync(PAGES_DIR)) {
    function analyzeDir(dir, type) {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          analyzeDir(filePath, type);
        } else if (file.endsWith('.js')) {
          mapping.pages.push(analyzePageUltraDetailed(filePath, type));
        }
      });
    }
    analyzeDir(PAGES_DIR, 'page');
  }
  
  console.log('🏗️ Analisando HTML completo...');
  analyzeHTMLComplete();
  
  console.log('🌐 Analisando controllers...');
  if (fs.existsSync(CONTROLLERS_DIR)) {
    const files = fs.readdirSync(CONTROLLERS_DIR);
    files.forEach(file => {
      if (file.endsWith('Controller.js')) {
        const filePath = path.join(CONTROLLERS_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        const endpoints = [];
        const endpointPattern = /export\s+async\s+function\s+(\w+)/g;
        let match;
        while ((match = endpointPattern.exec(content)) !== null) {
          const funcName = match[1];
          const beforeFunc = content.substring(Math.max(0, content.lastIndexOf('*/', match.index) - 500), match.index);
          const docMatch = beforeFunc.match(/\*\*[\s\S]*?\*\//);
          const doc = docMatch ? docMatch[0].replace(/\*/g, '').trim() : '';
          const routeMatch = doc.match(/(GET|POST|PUT|DELETE)\s+([^\s]+)/);
          
          endpoints.push({
            name: funcName,
            method: routeMatch ? routeMatch[1] : 'GET',
            route: routeMatch ? routeMatch[2] : null,
            documentation: doc.substring(0, 300)
          });
        }
        
        mapping.apis.push({
          controller: file,
          endpoints: endpoints,
          path: path.relative(BASE_DIR, filePath)
        });
      }
    });
  }
  
  console.log('🔧 Analisando sistemas globais...');
  const systems = [
    { name: 'dataLoader', file: 'dataLoader.js', description: 'Sistema de carregamento de dados com cache e deduplicação' },
    { name: 'dataStore', file: 'global-store.js', description: 'Repositório central de dados com cache e reatividade' },
    { name: 'chartFactory', file: 'chart-factory.js', description: 'Fábrica de gráficos padronizados (Chart.js)' },
    { name: 'chartCommunication', file: 'chart-communication.js', description: 'Sistema de comunicação entre gráficos e filtros globais' },
    { name: 'advancedCharts', file: 'advanced-charts.js', description: 'Gráficos avançados com Plotly.js' },
    { name: 'config', file: 'config.js', description: 'Configurações globais do sistema' },
  ];
  
  systems.forEach(system => {
    const filePath = path.join(CORE_DIR, system.file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const functions = [];
      const functionPattern = /^(export\s+)?(async\s+)?function\s+(\w+)/gm;
      let match;
      while ((match = functionPattern.exec(content)) !== null) {
        functions.push(match[3] || match[2]);
      }
      const methodPattern = /(\w+)\s*[:=]\s*(async\s+)?(function|\([^)]*\)\s*=>)/g;
      while ((match = methodPattern.exec(content)) !== null) {
        if (!functions.includes(match[1])) {
          functions.push(match[1]);
        }
      }
      
      mapping.globalSystems.push({
        name: system.name,
        file: system.file,
        description: system.description,
        functions: functions.slice(0, 30),
        path: path.relative(BASE_DIR, filePath),
        api: `window.${system.name}`
      });
    }
  });
  
  console.log('📝 Gerando documentação ultra detalhada...');
  const doc = generateUltraDetailedDocumentation();
  
  const outputPath = path.join(OUTPUT_DIR, 'SISTEMA_ULTRA_DETALHADO.md');
  fs.writeFileSync(outputPath, doc, 'utf-8');
  
  console.log(`\n✅ Mapeamento ULTRA detalhado concluído!`);
  console.log(`📄 Documentação salva em: ${outputPath}`);
  console.log(`\n📊 Estatísticas:`);
  console.log(`   - Models do banco: ${mapping.database.models.length}`);
  console.log(`   - Campos do banco: ${mapping.database.fields.length}`);
  console.log(`   - Índices: ${mapping.database.indexes.length}`);
  console.log(`   - Sistemas de cache: ${mapping.cache.systems.length}`);
  console.log(`   - Utilitários: ${mapping.utils.length}`);
  console.log(`   - Pipelines: ${mapping.pipelines.length}`);
  console.log(`   - Páginas: ${mapping.pages.length}`);
  console.log(`   - Sistemas globais: ${mapping.globalSystems.length}`);
  console.log(`   - Controllers: ${mapping.apis.length}`);
  console.log(`   - Páginas HTML: ${Object.keys(mapping.htmlElements).length}`);
}

main();

