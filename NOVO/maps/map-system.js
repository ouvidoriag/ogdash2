/**
 * Script de Mapeamento Completo do Sistema
 * 
 * Analisa todas as páginas, cards, gráficos, APIs e sistemas globais
 * Gera documentação completa em Markdown
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurações
const BASE_DIR = path.join(__dirname, '..');
const PAGES_DIR = path.join(BASE_DIR, 'public', 'scripts', 'pages');
const CORE_DIR = path.join(BASE_DIR, 'public', 'scripts', 'core');
const CONTROLLERS_DIR = path.join(BASE_DIR, 'src', 'api', 'controllers');
const OUTPUT_DIR = path.join(__dirname);

// Resultados
const mapping = {
  pages: [],
  globalSystems: [],
  apis: [],
  charts: [],
  cards: []
};

/**
 * Ler arquivo e extrair informações
 */
function analyzeFile(filePath, type) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(BASE_DIR, filePath);
  
  const info = {
    path: relativePath,
    type: type,
    apis: [],
    charts: [],
    cards: [],
    globalSystems: [],
    functions: [],
    elements: []
  };
  
  // Extrair APIs (window.dataLoader.load, fetch, etc)
  const apiPatterns = [
    /window\.dataLoader\?\.load\(['"]([^'"]+)['"]/g,
    /fetch\(['"]([^'"]+)['"]/g,
    /\/api\/[^\s'"]+/g
  ];
  
  apiPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const api = match[1] || match[0];
      if (api && !info.apis.includes(api)) {
        info.apis.push(api);
      }
    }
  });
  
  // Extrair gráficos (createBarChart, createLineChart, etc)
  const chartPatterns = [
    /createBarChart\(['"]([^'"]+)['"]/g,
    /createLineChart\(['"]([^'"]+)['"]/g,
    /createDoughnutChart\(['"]([^'"]+)['"]/g,
    /createPieChart\(['"]([^'"]+)['"]/g,
    /loadSankeyChart/g,
    /loadTreeMapChart/g,
    /loadGeographicMap/g
  ];
  
  chartPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const chartId = match[1] || match[0];
      if (chartId && !info.charts.includes(chartId)) {
        info.charts.push(chartId);
      }
    }
  });
  
  // Extrair cards/elementos (getElementById)
  const elementPattern = /getElementById\(['"]([^'"]+)['"]\)/g;
  let match;
  while ((match = elementPattern.exec(content)) !== null) {
    const elementId = match[1];
    if (elementId && !info.elements.includes(elementId)) {
      info.elements.push(elementId);
    }
  }
  
  // Extrair sistemas globais usados
  const globalPatterns = [
    /window\.dataLoader/g,
    /window\.dataStore/g,
    /window\.chartFactory/g,
    /window\.chartCommunication/g,
    /window\.Logger/g,
    /window\.dateUtils/g,
    /window\.config/g,
    /window\.advancedCharts/g
  ];
  
  globalPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      const system = pattern.source.replace(/[\\^$.*+?()[\]{}|]/g, '').replace('window', '').replace(/\./g, '');
      if (!info.globalSystems.includes(system)) {
        info.globalSystems.push(system);
      }
    }
  });
  
  // Extrair funções principais
  const functionPattern = /^(async\s+)?function\s+(\w+)/gm;
  while ((match = functionPattern.exec(content)) !== null) {
    info.functions.push(match[2]);
  }
  
  // Identificar cards por padrões comuns
  const cardPatterns = [
    /kpi\w+/gi,
    /card\w+/gi,
    /total\w+/gi,
    /info\w+/gi,
    /summary\w+/gi
  ];
  
  cardPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      if (!info.cards.includes(match[0])) {
        info.cards.push(match[0]);
      }
    }
  });
  
  return info;
}

/**
 * Analisar diretório recursivamente
 */
function analyzeDirectory(dir, type) {
  if (!fs.existsSync(dir)) {
    console.warn(`Diretório não encontrado: ${dir}`);
    return;
  }
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      analyzeDirectory(filePath, type);
    } else if (file.endsWith('.js')) {
      const info = analyzeFile(filePath, type);
      mapping.pages.push(info);
    }
  });
}

/**
 * Analisar sistemas globais
 */
function analyzeGlobalSystems() {
  const systems = [
    { name: 'dataLoader', file: 'dataLoader.js', description: 'Sistema de carregamento de dados com cache e deduplicação' },
    { name: 'dataStore', file: 'global-store.js', description: 'Repositório central de dados com cache e reatividade' },
    { name: 'chartFactory', file: 'chart-factory.js', description: 'Fábrica de gráficos padronizados (Chart.js)' },
    { name: 'chartCommunication', file: 'chart-communication.js', description: 'Sistema de comunicação entre gráficos e filtros globais' },
    { name: 'advancedCharts', file: 'advanced-charts.js', description: 'Gráficos avançados com Plotly.js (Sankey, TreeMap, etc)' },
    { name: 'config', file: 'config.js', description: 'Configurações globais do sistema' },
  ];
  
  systems.forEach(system => {
    const filePath = path.join(CORE_DIR, system.file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Extrair funções principais
      const functions = [];
      const functionPattern = /^(export\s+)?(async\s+)?function\s+(\w+)/gm;
      let match;
      while ((match = functionPattern.exec(content)) !== null) {
        functions.push(match[3] || match[2]);
      }
      
      // Extrair métodos de objeto
      const methodPattern = /(\w+)\s*[:=]\s*(async\s+)?function/g;
      while ((match = methodPattern.exec(content)) !== null) {
        if (!functions.includes(match[1])) {
          functions.push(match[1]);
        }
      }
      
      mapping.globalSystems.push({
        name: system.name,
        file: system.file,
        description: system.description,
        functions: functions.slice(0, 20), // Limitar a 20 funções
        path: path.relative(BASE_DIR, filePath)
      });
    }
  });
}

/**
 * Analisar controllers (APIs)
 */
function analyzeControllers() {
  if (!fs.existsSync(CONTROLLERS_DIR)) {
    console.warn(`Diretório de controllers não encontrado: ${CONTROLLERS_DIR}`);
    return;
  }
  
  const files = fs.readdirSync(CONTROLLERS_DIR);
  
  files.forEach(file => {
    if (file.endsWith('Controller.js')) {
      const filePath = path.join(CONTROLLERS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Extrair endpoints exportados
      const endpointPattern = /export\s+async\s+function\s+(\w+)/g;
      const endpoints = [];
      let match;
      while ((match = endpointPattern.exec(content)) !== null) {
        endpoints.push(match[1]);
      }
      
      // Extrair comentários de documentação
      const docPattern = /\/\*\*[\s\S]*?\*\//g;
      const docs = [];
      while ((match = docPattern.exec(content)) !== null) {
        docs.push(match[0]);
      }
      
      mapping.apis.push({
        controller: file,
        endpoints: endpoints,
        path: path.relative(BASE_DIR, filePath),
        documentation: docs.slice(0, 3) // Primeiros 3 comentários
      });
    }
  });
}

/**
 * Gerar documentação Markdown
 */
function generateDocumentation() {
  let md = `# 🗺️ MAPEAMENTO COMPLETO DO SISTEMA

**Data de Geração**: ${new Date().toLocaleString('pt-BR')}
**Total de Páginas**: ${mapping.pages.length}
**Total de Sistemas Globais**: ${mapping.globalSystems.length}
**Total de Controllers**: ${mapping.apis.length}

---

## 📋 ÍNDICE

1. [Sistemas Globais](#sistemas-globais)
2. [APIs e Controllers](#apis-e-controllers)
3. [Páginas Detalhadas](#páginas-detalhadas)
4. [Resumo de Gráficos](#resumo-de-gráficos)
5. [Resumo de Cards](#resumo-de-cards)

---

## 🔧 SISTEMAS GLOBAIS

`;

  // Sistemas Globais
  mapping.globalSystems.forEach(system => {
    md += `### **${system.name}** - \`window.${system.name}\`

**Arquivo**: \`${system.path}\`
**Descrição**: ${system.description}

**Funções Principais**:
`;
    system.functions.forEach(func => {
      md += `- \`${func}()\`\n`;
    });
    md += `\n`;
  });

  md += `---

## 🌐 APIs E CONTROLLERS

`;

  // APIs
  mapping.apis.forEach(api => {
    md += `### **${api.controller}**

**Arquivo**: \`${api.path}\`

**Endpoints**:
`;
    api.endpoints.forEach(endpoint => {
      md += `- \`${endpoint}()\`\n`;
    });
    md += `\n`;
  });

  md += `---

## 📄 PÁGINAS DETALHADAS

`;

  // Agrupar páginas por tipo
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
      const pageName = path.basename(page.path, '.js');
      md += `#### **${pageName}**

**Arquivo**: \`${page.path}\`

`;

      // APIs usadas
      if (page.apis.length > 0) {
        md += `**APIs Utilizadas** (${page.apis.length}):\n`;
        page.apis.forEach(api => {
          md += `- \`${api}\`\n`;
        });
        md += `\n`;
      }

      // Gráficos
      if (page.charts.length > 0) {
        md += `**Gráficos** (${page.charts.length}):\n`;
        page.charts.forEach(chart => {
          md += `- \`${chart}\`\n`;
        });
        md += `\n`;
      }

      // Cards/Elementos
      if (page.cards.length > 0 || page.elements.length > 0) {
        md += `**Cards/Elementos** (${page.cards.length + page.elements.length}):\n`;
        [...page.cards, ...page.elements].slice(0, 20).forEach(element => {
          md += `- \`${element}\`\n`;
        });
        md += `\n`;
      }

      // Sistemas Globais
      if (page.globalSystems.length > 0) {
        md += `**Sistemas Globais Usados**: ${page.globalSystems.join(', ')}\n\n`;
      }

      // Funções principais
      if (page.functions.length > 0) {
        md += `**Funções Principais** (${page.functions.length}):\n`;
        page.functions.slice(0, 10).forEach(func => {
          md += `- \`${func}()\`\n`;
        });
        md += `\n`;
      }

      md += `---\n\n`;
    });
  });

  md += `---

## 📊 RESUMO DE GRÁFICOS

`;

  // Coletar todos os gráficos únicos
  const allCharts = new Set();
  mapping.pages.forEach(page => {
    page.charts.forEach(chart => allCharts.add(chart));
  });

  md += `**Total de Gráficos Únicos**: ${allCharts.size}\n\n`;
  Array.from(allCharts).sort().forEach(chart => {
    md += `- \`${chart}\`\n`;
  });

  md += `---

## 🎴 RESUMO DE CARDS

`;

  // Coletar todos os cards únicos
  const allCards = new Set();
  mapping.pages.forEach(page => {
    page.cards.forEach(card => allCards.add(card));
    page.elements.forEach(element => {
      if (element.toLowerCase().includes('kpi') || 
          element.toLowerCase().includes('card') ||
          element.toLowerCase().includes('total') ||
          element.toLowerCase().includes('info')) {
        allCards.add(element);
      }
    });
  });

  md += `**Total de Cards Únicos**: ${allCards.size}\n\n`;
  Array.from(allCards).sort().forEach(card => {
    md += `- \`${card}\`\n`;
  });

  md += `---

## 📝 NOTAS

- Este mapeamento foi gerado automaticamente pelo script \`map-system.js\`
- Para atualizar, execute: \`node maps/map-system.js\`
- Alguns elementos podem não ser detectados se usarem padrões não convencionais

---

**Fim do Mapeamento**
`;

  return md;
}

/**
 * Executar mapeamento
 */
function main() {
  console.log('🗺️ Iniciando mapeamento do sistema...\n');
  
  // Analisar páginas
  console.log('📄 Analisando páginas...');
  analyzeDirectory(PAGES_DIR, 'page');
  
  // Analisar sistemas globais
  console.log('🔧 Analisando sistemas globais...');
  analyzeGlobalSystems();
  
  // Analisar controllers
  console.log('🌐 Analisando controllers/APIs...');
  analyzeControllers();
  
  // Gerar documentação
  console.log('📝 Gerando documentação...');
  const documentation = generateDocumentation();
  
  // Salvar
  const outputPath = path.join(OUTPUT_DIR, 'SISTEMA_COMPLETO_MAPEADO.md');
  fs.writeFileSync(outputPath, documentation, 'utf-8');
  
  console.log(`\n✅ Mapeamento concluído!`);
  console.log(`📄 Documentação salva em: ${outputPath}`);
  console.log(`\n📊 Estatísticas:`);
  console.log(`   - Páginas analisadas: ${mapping.pages.length}`);
  console.log(`   - Sistemas globais: ${mapping.globalSystems.length}`);
  console.log(`   - Controllers: ${mapping.apis.length}`);
  console.log(`   - Total de APIs encontradas: ${mapping.pages.reduce((sum, p) => sum + p.apis.length, 0)}`);
  console.log(`   - Total de gráficos encontrados: ${mapping.pages.reduce((sum, p) => sum + p.charts.length, 0)}`);
}

// Executar
main();

