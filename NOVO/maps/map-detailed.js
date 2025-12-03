/**
 * Script de Mapeamento Detalhado do Sistema
 * 
 * Analisa páginas, HTML, APIs, gráficos, cards e sistemas globais
 * Gera documentação completa e detalhada
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
const HTML_FILE = path.join(BASE_DIR, 'public', 'index.html');
const OUTPUT_DIR = path.join(__dirname);

const mapping = {
  pages: [],
  globalSystems: [],
  apis: [],
  htmlElements: {}
};

/**
 * Analisar arquivo JavaScript detalhadamente
 */
function analyzeFileDetailed(filePath, type) {
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
    globalSystems: [],
    functions: [],
    dataSources: [],
    description: ''
  };
  
  // Extrair descrição do comentário inicial
  const descMatch = content.match(/\/\*\*[\s\S]*?Página:[\s\S]*?\*\//);
  if (descMatch) {
    info.description = descMatch[0].replace(/\*\//g, '').replace(/\/\*\*/g, '').trim();
  }
  
  // Extrair APIs com contexto
  const apiPatterns = [
    { pattern: /window\.dataLoader\?\.load\(['"]([^'"]+)['"]/g, type: 'dataLoader' },
    { pattern: /fetch\(['"]([^'"]+)['"]/g, type: 'fetch' },
    { pattern: /\/api\/[^\s'"]+/g, type: 'direct' }
  ];
  
  apiPatterns.forEach(({ pattern, type: apiType }) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const api = match[1] || match[0];
      if (api && api.startsWith('/api/') && !info.apis.find(a => a.url === api)) {
        // Tentar encontrar contexto (variável que recebe)
        const beforeMatch = content.substring(Math.max(0, match.index - 100), match.index);
        const afterMatch = content.substring(match.index, Math.min(content.length, match.index + 200));
        const varMatch = beforeMatch.match(/(\w+)\s*=\s*(?:await\s+)?(?:window\.dataLoader|fetch)/);
        const varName = varMatch ? varMatch[1] : null;
        
        info.apis.push({
          url: api,
          type: apiType,
          variable: varName,
          context: afterMatch.substring(0, 100).replace(/\n/g, ' ').trim()
        });
        
        info.dataSources.push({
          type: 'API',
          source: api,
          variable: varName
        });
      }
    }
  });
  
  // Extrair gráficos com IDs
  const chartPatterns = [
    { pattern: /createBarChart\(['"]([^'"]+)['"]/g, type: 'bar' },
    { pattern: /createLineChart\(['"]([^'"]+)['"]/g, type: 'line' },
    { pattern: /createDoughnutChart\(['"]([^'"]+)['"]/g, type: 'doughnut' },
    { pattern: /createPieChart\(['"]([^'"]+)['"]/g, type: 'pie' },
    { pattern: /loadSankeyChart/g, type: 'sankey' },
    { pattern: /loadTreeMapChart/g, type: 'treemap' },
    { pattern: /loadGeographicMap/g, type: 'geographic' }
  ];
  
  chartPatterns.forEach(({ pattern, type: chartType }) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const chartId = match[1] || chartType;
      if (!info.charts.find(c => c.id === chartId)) {
        // Encontrar dados usados
        const afterMatch = content.substring(match.index, Math.min(content.length, match.index + 500));
        const dataMatch = afterMatch.match(/(\w+)(?:\.\w+)*\s*[,\)]/);
        const dataVar = dataMatch ? dataMatch[1] : null;
        
        info.charts.push({
          id: chartId,
          type: chartType,
          dataVariable: dataVar
        });
      }
    }
  });
  
  // Extrair KPIs e Cards
  const kpiPattern = /getElementById\(['"](kpi\w+)['"]\)/g;
  let match;
  while ((match = kpiPattern.exec(content)) !== null) {
    const kpiId = match[1];
    if (!info.kpis.includes(kpiId)) {
      info.kpis.push(kpiId);
      
      // Tentar encontrar de onde vem o valor
      const afterMatch = content.substring(match.index, Math.min(content.length, match.index + 300));
      const valueMatch = afterMatch.match(/\.(?:textContent|innerHTML)\s*=\s*([^;]+)/);
      const valueSource = valueMatch ? valueMatch[1].trim() : null;
      
      info.cards.push({
        id: kpiId,
        type: 'KPI',
        valueSource: valueSource
      });
    }
  }
  
  // Extrair outros elementos importantes
  const elementPattern = /getElementById\(['"]([^'"]+)['"]\)/g;
  const seenElements = new Set();
  while ((match = elementPattern.exec(content)) !== null) {
    const elementId = match[1];
    if (!seenElements.has(elementId) && 
        (elementId.includes('card') || 
         elementId.includes('info') || 
         elementId.includes('total') ||
         elementId.includes('summary'))) {
      seenElements.add(elementId);
      info.cards.push({
        id: elementId,
        type: 'Element',
        valueSource: null
      });
    }
  }
  
  // Extrair sistemas globais
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
      info.globalSystems.push(name);
    }
  });
  
  // Extrair funções principais
  const functionPattern = /^(async\s+)?function\s+(\w+)/gm;
  while ((match = functionPattern.exec(content)) !== null) {
    if (!info.functions.includes(match[2])) {
      info.functions.push(match[2]);
    }
  }
  
  return info;
}

/**
 * Analisar HTML para mapear elementos
 */
function analyzeHTML() {
  if (!fs.existsSync(HTML_FILE)) {
    console.warn('HTML file not found');
    return;
  }
  
  const content = fs.readFileSync(HTML_FILE, 'utf-8');
  
  // Extrair todas as seções de página
  const pagePattern = /<section[^>]*id=['"]page-([^'"]+)['"][^>]*>([\s\S]*?)<\/section>/g;
  let match;
  
  while ((match = pagePattern.exec(content)) !== null) {
    const pageId = match[1];
    const pageContent = match[2];
    
    const elements = {
      kpis: [],
      charts: [],
      cards: [],
      filters: []
    };
    
    // Extrair KPIs
    const kpiPattern = /id=['"](kpi\w+)['"]/g;
    let kpiMatch;
    while ((kpiMatch = kpiPattern.exec(pageContent)) !== null) {
      elements.kpis.push(kpiMatch[1]);
    }
    
    // Extrair gráficos (canvas)
    const canvasPattern = /id=['"](chart\w+|canvas\w+)['"]/g;
    let canvasMatch;
    while ((canvasMatch = canvasPattern.exec(pageContent)) !== null) {
      elements.charts.push(canvasMatch[1]);
    }
    
    // Extrair cards
    const cardPattern = /class=['"][^'"]*glass[^'"]*['"][^>]*>[\s\S]*?id=['"]([^'"]+)['"]/g;
    let cardMatch;
    while ((cardMatch = cardPattern.exec(pageContent)) !== null) {
      if (cardMatch[1] && !elements.cards.includes(cardMatch[1])) {
        elements.cards.push(cardMatch[1]);
      }
    }
    
    // Extrair filtros (select, input)
    const filterPattern = /id=['"](filtro\w+|select\w+)['"]/g;
    let filterMatch;
    while ((filterMatch = filterPattern.exec(pageContent)) !== null) {
      elements.filters.push(filterMatch[1]);
    }
    
    mapping.htmlElements[pageId] = elements;
  }
}

/**
 * Analisar sistemas globais detalhadamente
 */
function analyzeGlobalSystemsDetailed() {
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
      const methods = [];
      
      // Funções exportadas
      const functionPattern = /^(export\s+)?(async\s+)?function\s+(\w+)/gm;
      let match;
      while ((match = functionPattern.exec(content)) !== null) {
        functions.push(match[3] || match[2]);
      }
      
      // Métodos de objeto
      const methodPattern = /(\w+)\s*[:=]\s*(async\s+)?(function|\([^)]*\)\s*=>)/g;
      while ((match = methodPattern.exec(content)) !== null) {
        if (!methods.includes(match[1]) && !functions.includes(match[1])) {
          methods.push(match[1]);
        }
      }
      
      mapping.globalSystems.push({
        name: system.name,
        file: system.file,
        description: system.description,
        functions: [...functions, ...methods].slice(0, 30),
        path: path.relative(BASE_DIR, filePath),
        api: `window.${system.name}`
      });
    }
  });
}

/**
 * Analisar controllers detalhadamente
 */
function analyzeControllersDetailed() {
  if (!fs.existsSync(CONTROLLERS_DIR)) return;
  
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
        
        // Tentar encontrar documentação
        const beforeFunc = content.substring(Math.max(0, content.lastIndexOf('*/', match.index) - 500), match.index);
        const docMatch = beforeFunc.match(/\*\*[\s\S]*?\*\//);
        const doc = docMatch ? docMatch[0].replace(/\*/g, '').trim() : '';
        
        // Tentar encontrar rota (GET, POST, etc)
        const routeMatch = doc.match(/(GET|POST|PUT|DELETE)\s+([^\s]+)/);
        
        endpoints.push({
          name: funcName,
          method: routeMatch ? routeMatch[1] : 'GET',
          route: routeMatch ? routeMatch[2] : null,
          documentation: doc.substring(0, 200)
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

/**
 * Gerar documentação detalhada
 */
function generateDetailedDocumentation() {
  let md = `# 🗺️ MAPEAMENTO DETALHADO E COMPLETO DO SISTEMA

**Data de Geração**: ${new Date().toLocaleString('pt-BR')}
**Versão**: 2.0 - Detalhado

---

## 📋 ÍNDICE

1. [Sistemas Globais Detalhados](#sistemas-globais-detalhados)
2. [APIs e Controllers Completos](#apis-e-controllers-completos)
3. [Páginas com Análise Completa](#páginas-com-análise-completa)
4. [Elementos HTML Mapeados](#elementos-html-mapeados)
5. [Resumo e Estatísticas](#resumo-e-estatísticas)

---

## 🔧 SISTEMAS GLOBAIS DETALHADOS

`;

  mapping.globalSystems.forEach(system => {
    md += `### **${system.name}** - \`${system.api}\`

**Arquivo**: \`${system.path}\`
**Descrição**: ${system.description}

**API Principal**: \`window.${system.name}\`

**Funções e Métodos Disponíveis** (${system.functions.length}):
`;
    system.functions.forEach(func => {
      md += `- \`${func}()\`\n`;
    });
    md += `\n**Como Usar**:
\`\`\`javascript
// Exemplo de uso
const data = await window.${system.name}.load('/api/endpoint');
\`\`\`

---

`;
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
- **Documentação**: ${endpoint.documentation.substring(0, 150)}...

`;
    });
    md += `---\n\n`;
  });

  md += `## 📄 PÁGINAS COM ANÁLISE COMPLETA

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

      // APIs com contexto
      if (page.apis.length > 0) {
        md += `**APIs Utilizadas** (${page.apis.length}):\n\n`;
        page.apis.forEach(api => {
          md += `- **\`${api.url}\`**\n`;
          md += `  - Tipo: ${api.type}\n`;
          if (api.variable) {
            md += `  - Variável: \`${api.variable}\`\n`;
          }
          md += `  - Contexto: ${api.context.substring(0, 80)}...\n\n`;
        });
      }

      // Gráficos
      if (page.charts.length > 0) {
        md += `**Gráficos** (${page.charts.length}):\n\n`;
        page.charts.forEach(chart => {
          md += `- **\`${chart.id}\`** (${chart.type})\n`;
          if (chart.dataVariable) {
            md += `  - Dados: \`${chart.dataVariable}\`\n`;
          }
          md += `\n`;
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
            md += `  - Fonte do valor: \`${card.valueSource}\`\n`;
          }
        });
        md += `\n`;
      }

      // Sistemas Globais
      if (page.globalSystems.length > 0) {
        md += `**Sistemas Globais Usados**: ${page.globalSystems.map(s => `\`${s}\``).join(', ')}\n\n`;
      }

      // Funções principais
      if (page.functions.length > 0) {
        md += `**Funções Principais** (${page.functions.length}):\n`;
        page.functions.slice(0, 15).forEach(func => {
          md += `- \`${func}()\`\n`;
        });
        md += `\n`;
      }

      // Fontes de dados
      if (page.dataSources.length > 0) {
        md += `**Fontes de Dados**:\n`;
        page.dataSources.forEach(source => {
          md += `- ${source.type}: \`${source.source}\` → \`${source.variable || 'N/A'}\`\n`;
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

- **KPIs**: ${elements.kpis.length} (${elements.kpis.slice(0, 5).join(', ')}${elements.kpis.length > 5 ? '...' : ''})
- **Gráficos**: ${elements.charts.length} (${elements.charts.slice(0, 5).join(', ')}${elements.charts.length > 5 ? '...' : ''})
- **Cards**: ${elements.cards.length}
- **Filtros**: ${elements.filters.length} (${elements.filters.slice(0, 5).join(', ')}${elements.filters.length > 5 ? '...' : ''})

`;
  });

  md += `---

## 📊 RESUMO E ESTATÍSTICAS

### Totais:
- **Páginas Analisadas**: ${mapping.pages.length}
- **Sistemas Globais**: ${mapping.globalSystems.length}
- **Controllers**: ${mapping.apis.length}
- **Total de APIs**: ${mapping.pages.reduce((sum, p) => sum + p.apis.length, 0)}
- **Total de Gráficos**: ${mapping.pages.reduce((sum, p) => sum + p.charts.length, 0)}
- **Total de KPIs/Cards**: ${mapping.pages.reduce((sum, p) => sum + p.kpis.length + p.cards.length, 0)}

### Por Tipo de Página:
`;
  
  Object.keys(pagesByType).forEach(type => {
    md += `- **${type}**: ${pagesByType[type].length} páginas\n`;
  });

  md += `---

## 📝 NOTAS IMPORTANTES

1. **Este mapeamento foi gerado automaticamente** pelo script \`map-detailed.js\`
2. **Para atualizar**: Execute \`node maps/map-detailed.js\`
3. **Alguns elementos podem não ser detectados** se usarem padrões não convencionais
4. **APIs são extraídas** de chamadas \`window.dataLoader.load()\`, \`fetch()\` e padrões \`/api/*\`
5. **Gráficos são identificados** por IDs de canvas e chamadas de criação de gráficos
6. **KPIs são identificados** por IDs que começam com \`kpi\` e elementos com classes \`glass\`

---

**Fim do Mapeamento Detalhado**
`;

  return md;
}

/**
 * Executar
 */
function main() {
  console.log('🗺️ Iniciando mapeamento detalhado...\n');
  
  console.log('📄 Analisando páginas...');
  if (fs.existsSync(PAGES_DIR)) {
    function analyzeDir(dir, type) {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          analyzeDir(filePath, type);
        } else if (file.endsWith('.js')) {
          mapping.pages.push(analyzeFileDetailed(filePath, type));
        }
      });
    }
    analyzeDir(PAGES_DIR, 'page');
  }
  
  console.log('🏗️ Analisando HTML...');
  analyzeHTML();
  
  console.log('🔧 Analisando sistemas globais...');
  analyzeGlobalSystemsDetailed();
  
  console.log('🌐 Analisando controllers...');
  analyzeControllersDetailed();
  
  console.log('📝 Gerando documentação detalhada...');
  const doc = generateDetailedDocumentation();
  
  const outputPath = path.join(OUTPUT_DIR, 'SISTEMA_DETALHADO_MAPEADO.md');
  fs.writeFileSync(outputPath, doc, 'utf-8');
  
  console.log(`\n✅ Mapeamento detalhado concluído!`);
  console.log(`📄 Documentação salva em: ${outputPath}`);
  console.log(`\n📊 Estatísticas:`);
  console.log(`   - Páginas: ${mapping.pages.length}`);
  console.log(`   - Sistemas globais: ${mapping.globalSystems.length}`);
  console.log(`   - Controllers: ${mapping.apis.length}`);
  console.log(`   - Páginas HTML mapeadas: ${Object.keys(mapping.htmlElements).length}`);
}

main();

