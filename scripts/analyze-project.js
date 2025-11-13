/**
 * Script de Análise Completa do Projeto
 * Analisa todos os arquivos, dependências, ordem de carregamento, duplicidades e problemas
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Estrutura para armazenar análise
const analysis = {
  files: [],
  dependencies: new Map(),
  loadOrder: [],
  duplicates: [],
  issues: [],
  structure: {}
};

// Extensões de arquivos a analisar
const fileExtensions = ['.js', '.html', '.json', '.md', '.prisma', '.bat', '.ps1'];
const ignoreDirs = ['node_modules', '.git', 'build', 'dist', 'Wellington'];

/**
 * Analisar um arquivo
 */
function analyzeFile(filePath, relativePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const stats = fs.statSync(filePath);
  const ext = path.extname(filePath);
  
  const fileInfo = {
    path: relativePath,
    fullPath: filePath,
    extension: ext,
    size: stats.size,
    lines: content.split('\n').length,
    lastModified: stats.mtime,
    dependencies: [],
    exports: [],
    imports: [],
    issues: [],
    description: '',
    category: categorizeFile(relativePath)
  };
  
  // Análise específica por tipo
  if (ext === '.js') {
    analyzeJavaScript(content, fileInfo);
  } else if (ext === '.html') {
    analyzeHTML(content, fileInfo);
  } else if (ext === '.json') {
    analyzeJSON(content, fileInfo);
  } else if (ext === '.md') {
    analyzeMarkdown(content, fileInfo);
  }
  
  // Verificar duplicidades
  checkDuplicates(content, fileInfo);
  
  // Verificar problemas comuns
  checkCommonIssues(content, fileInfo);
  
  analysis.files.push(fileInfo);
  return fileInfo;
}

/**
 * Categorizar arquivo
 */
function categorizeFile(filePath) {
  if (filePath.includes('public/scripts/')) return 'frontend-script';
  if (filePath.includes('src/')) return 'backend';
  if (filePath.includes('scripts/')) return 'utility-script';
  if (filePath.includes('prisma/')) return 'database';
  if (filePath.includes('public/')) return 'public-asset';
  if (filePath.includes('pasta-teste/')) return 'test';
  if (filePath.includes('Wellington/')) return 'wellington';
  if (filePath.endsWith('.md')) return 'documentation';
  return 'other';
}

/**
 * Analisar JavaScript
 */
function analyzeJavaScript(content, fileInfo) {
  // Encontrar imports/requires
  const importRegex = /import\s+.*?\s+from\s+['"](.+?)['"]/g;
  const requireRegex = /require\(['"](.+?)['"]\)/g;
  
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    fileInfo.imports.push(match[1]);
  }
  while ((match = requireRegex.exec(content)) !== null) {
    fileInfo.imports.push(match[1]);
  }
  
  // Encontrar exports
  const exportRegex = /export\s+(?:default\s+)?(?:function|const|class|let|var|async\s+function)\s+(\w+)/g;
  while ((match = exportRegex.exec(content)) !== null) {
    fileInfo.exports.push(match[1]);
  }
  
  // Encontrar window.* assignments (globais)
  const globalRegex = /window\.(\w+)\s*=/g;
  const globals = [];
  while ((match = globalRegex.exec(content)) !== null) {
    globals.push(match[1]);
  }
  if (globals.length > 0) {
    fileInfo.globals = globals;
  }
  
  // Verificar se é módulo ou script inline
  fileInfo.isModule = content.includes('export') || content.includes('module.exports');
  fileInfo.isInline = content.includes('window.') && !fileInfo.isModule;
  
  // Verificar funções principais
  const functionRegex = /(?:async\s+)?function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?\(/g;
  const functions = [];
  while ((match = functionRegex.exec(content)) !== null) {
    functions.push(match[1] || match[2]);
  }
  if (functions.length > 0) {
    fileInfo.functions = functions.slice(0, 10); // Limitar a 10
  }
  
  // Verificar problemas
  if (content.includes('console.log') && content.split('console.log').length > 20) {
    fileInfo.issues.push('Muitos console.log (pode indicar debug não removido)');
  }
  
  if (content.includes('TODO') || content.includes('FIXME') || content.includes('XXX')) {
    fileInfo.issues.push('Contém TODO/FIXME/XXX');
  }
  
  if (content.includes('eval(') || content.includes('Function(')) {
    fileInfo.issues.push('⚠️ Usa eval() - risco de segurança');
  }
}

/**
 * Analisar HTML
 */
function analyzeHTML(content, fileInfo) {
  // Encontrar scripts carregados
  const scriptRegex = /<script\s+(?:src=["'](.+?)["']|type=["'](.+?)["'])/g;
  const scripts = [];
  let match;
  while ((match = scriptRegex.exec(content)) !== null) {
    if (match[1]) scripts.push({ src: match[1], type: 'external' });
    if (match[2] && match[2] !== 'text/javascript') scripts.push({ type: match[2] });
  }
  fileInfo.scripts = scripts;
  
  // Encontrar ordem de carregamento
  const scriptOrder = [];
  const scriptSrcRegex = /<script\s+src=["'](.+?)["']/g;
  while ((match = scriptSrcRegex.exec(content)) !== null) {
    scriptOrder.push(match[1]);
  }
  fileInfo.scriptLoadOrder = scriptOrder;
  
  // Verificar scripts inline
  const inlineScriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/g;
  const inlineScripts = [];
  while ((match = inlineScriptRegex.exec(content)) !== null) {
    if (!match[1].includes('src=')) {
      inlineScripts.push(match[1].substring(0, 100) + '...');
    }
  }
  if (inlineScripts.length > 0) {
    fileInfo.inlineScripts = inlineScripts.length;
  }
  
  // Verificar problemas
  if (content.includes('http://') && !content.includes('localhost')) {
    fileInfo.issues.push('Contém URLs HTTP (não seguras)');
  }
}

/**
 * Analisar JSON
 */
function analyzeJSON(content, fileInfo) {
  try {
    const data = JSON.parse(content);
    fileInfo.jsonKeys = Object.keys(data).slice(0, 20);
    fileInfo.jsonType = Array.isArray(data) ? 'array' : 'object';
    if (Array.isArray(data)) {
      fileInfo.jsonLength = data.length;
    }
  } catch (e) {
    fileInfo.issues.push('JSON inválido: ' + e.message);
  }
}

/**
 * Analisar Markdown
 */
function analyzeMarkdown(content, fileInfo) {
  const headers = content.match(/^#+\s+(.+)$/gm) || [];
  fileInfo.headers = headers.slice(0, 10);
  fileInfo.isDocumentation = true;
}

/**
 * Verificar duplicidades
 */
function checkDuplicates(content, fileInfo) {
  // Verificar se há código duplicado (simples - funções com mesmo nome)
  const functionNames = content.match(/(?:function|const|let|var)\s+(\w+)\s*[=(]/g) || [];
  const names = functionNames.map(m => m.match(/(\w+)/)[1]);
  
  // Comparar com outros arquivos
  analysis.files.forEach(otherFile => {
    if (otherFile.path !== fileInfo.path && otherFile.functions) {
      const duplicates = names.filter(name => otherFile.functions.includes(name));
      if (duplicates.length > 0) {
        analysis.duplicates.push({
          file1: fileInfo.path,
          file2: otherFile.path,
          functions: duplicates
        });
      }
    }
  });
}

/**
 * Verificar problemas comuns
 */
function checkCommonIssues(content, fileInfo) {
  // Verificar se há await sem try/catch
  if (content.includes('await') && !content.includes('try') && !content.includes('catch')) {
    fileInfo.issues.push('⚠️ await sem try/catch (pode causar erros não tratados)');
  }
  
  // Verificar se há setTimeout/setInterval sem limpeza
  const setTimeoutCount = (content.match(/setTimeout/g) || []).length;
  const clearTimeoutCount = (content.match(/clearTimeout/g) || []).length;
  if (setTimeoutCount > clearTimeoutCount * 2) {
    fileInfo.issues.push('⚠️ Muitos setTimeout sem clearTimeout correspondente');
  }
  
  // Verificar se há addEventListener sem removeEventListener
  const addListenerCount = (content.match(/addEventListener/g) || []).length;
  const removeListenerCount = (content.match(/removeEventListener/g) || []).length;
  if (addListenerCount > removeListenerCount * 2) {
    fileInfo.issues.push('⚠️ Muitos addEventListener sem removeEventListener correspondente');
  }
  
  // Verificar se há variáveis globais
  if (fileInfo.globals && fileInfo.globals.length > 10) {
    fileInfo.issues.push('⚠️ Muitas variáveis globais (' + fileInfo.globals.length + ')');
  }
}

/**
 * Percorrer diretório recursivamente
 */
function walkDirectory(dir, relativePath = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  entries.forEach(entry => {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.join(relativePath, entry.name);
    
    if (entry.isDirectory()) {
      if (!ignoreDirs.some(ignore => relPath.includes(ignore))) {
        walkDirectory(fullPath, relPath);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (fileExtensions.includes(ext)) {
        try {
          analyzeFile(fullPath, relPath);
        } catch (error) {
          console.error(`Erro ao analisar ${relPath}:`, error.message);
        }
      }
    }
  });
}

/**
 * Analisar ordem de carregamento
 */
function analyzeLoadOrder() {
  // Encontrar index.html e analisar ordem de scripts
  const indexHtml = analysis.files.find(f => f.path.includes('index.html'));
  if (indexHtml && indexHtml.scriptLoadOrder) {
    analysis.loadOrder = indexHtml.scriptLoadOrder;
    
    // Verificar se há dependências circulares ou problemas de ordem
    indexHtml.scriptLoadOrder.forEach((script, index) => {
      const scriptFile = analysis.files.find(f => f.path.includes(script.replace(/^\//, '')));
      if (scriptFile) {
        // Verificar se script depende de algo que vem depois
        scriptFile.imports.forEach(imp => {
          const depIndex = indexHtml.scriptLoadOrder.findIndex(s => s.includes(imp));
          if (depIndex > index) {
            analysis.issues.push({
              type: 'load-order',
              severity: 'warning',
              message: `Script ${script} pode depender de ${indexHtml.scriptLoadOrder[depIndex]} que é carregado depois`,
              file: indexHtml.path
            });
          }
        });
      }
    });
  }
}

/**
 * Gerar relatório
 */
function generateReport() {
  const reportDir = path.join(projectRoot, 'analise-projeto');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  // Relatório geral
  const generalReport = {
    totalFiles: analysis.files.length,
    byCategory: {},
    byExtension: {},
    totalIssues: analysis.issues.length + analysis.files.reduce((sum, f) => sum + f.issues.length, 0),
    duplicates: analysis.duplicates.length,
    loadOrderIssues: analysis.issues.filter(i => i.type === 'load-order').length
  };
  
  analysis.files.forEach(file => {
    generalReport.byCategory[file.category] = (generalReport.byCategory[file.category] || 0) + 1;
    generalReport.byExtension[file.extension] = (generalReport.byExtension[file.extension] || 0) + 1;
  });
  
  // Salvar relatório geral
  fs.writeFileSync(
    path.join(reportDir, 'relatorio-geral.json'),
    JSON.stringify(generalReport, null, 2)
  );
  
  // Relatório detalhado de arquivos
  fs.writeFileSync(
    path.join(reportDir, 'arquivos-detalhado.json'),
    JSON.stringify(analysis.files, null, 2)
  );
  
  // Relatório de problemas
  const allIssues = [
    ...analysis.issues,
    ...analysis.files.flatMap(f => f.issues.map(i => ({
      file: f.path,
      issue: i,
      category: f.category
    })))
  ];
  
  fs.writeFileSync(
    path.join(reportDir, 'problemas-encontrados.json'),
    JSON.stringify(allIssues, null, 2)
  );
  
  // Relatório de duplicidades
  fs.writeFileSync(
    path.join(reportDir, 'duplicidades.json'),
    JSON.stringify(analysis.duplicates, null, 2)
  );
  
  // Mapa mental em Markdown
  generateMindMap(reportDir);
  
  // Relatório de ordem de carregamento
  if (analysis.loadOrder.length > 0) {
    fs.writeFileSync(
      path.join(reportDir, 'ordem-carregamento.json'),
      JSON.stringify(analysis.loadOrder, null, 2)
    );
  }
  
  console.log(`\n✅ Análise concluída!`);
  console.log(`📁 Relatórios salvos em: ${reportDir}`);
  console.log(`📊 Total de arquivos analisados: ${analysis.files.length}`);
  console.log(`⚠️  Total de problemas encontrados: ${allIssues.length}`);
  console.log(`🔄 Duplicidades encontradas: ${analysis.duplicates.length}`);
}

/**
 * Gerar mapa mental em Markdown
 */
function generateMindMap(reportDir) {
  let markdown = `# 🗺️ MAPA MENTAL DO PROJETO\n\n`;
  markdown += `*Gerado em: ${new Date().toLocaleString('pt-BR')}*\n\n`;
  
  // Estrutura por categoria
  markdown += `## 📂 Estrutura do Projeto\n\n`;
  const categories = {};
  analysis.files.forEach(file => {
    if (!categories[file.category]) {
      categories[file.category] = [];
    }
    categories[file.category].push(file);
  });
  
  Object.keys(categories).sort().forEach(category => {
    markdown += `### ${getCategoryName(category)}\n\n`;
    categories[category].forEach(file => {
      markdown += `- **${file.path}**\n`;
      markdown += `  - Linhas: ${file.lines}\n`;
      markdown += `  - Tamanho: ${(file.size / 1024).toFixed(2)} KB\n`;
      if (file.functions && file.functions.length > 0) {
        markdown += `  - Funções principais: ${file.functions.slice(0, 5).join(', ')}\n`;
      }
      if (file.issues.length > 0) {
        markdown += `  - ⚠️ Problemas: ${file.issues.length}\n`;
      }
      markdown += `\n`;
    });
  });
  
  // Ordem de carregamento
  if (analysis.loadOrder.length > 0) {
    markdown += `## 📜 Ordem de Carregamento de Scripts\n\n`;
    markdown += `\`\`\`\n`;
    analysis.loadOrder.forEach((script, index) => {
      markdown += `${index + 1}. ${script}\n`;
    });
    markdown += `\`\`\`\n\n`;
  }
  
  // Problemas críticos
  const criticalIssues = analysis.files.filter(f => 
    f.issues.some(i => i.includes('⚠️') || i.includes('risco'))
  );
  
  if (criticalIssues.length > 0) {
    markdown += `## ⚠️ Problemas Críticos\n\n`;
    criticalIssues.forEach(file => {
      markdown += `### ${file.path}\n\n`;
      file.issues.forEach(issue => {
        markdown += `- ${issue}\n`;
      });
      markdown += `\n`;
    });
  }
  
  // Duplicidades
  if (analysis.duplicates.length > 0) {
    markdown += `## 🔄 Duplicidades Encontradas\n\n`;
    analysis.duplicates.forEach(dup => {
      markdown += `- **${dup.functions.join(', ')}**\n`;
      markdown += `  - Arquivo 1: ${dup.file1}\n`;
      markdown += `  - Arquivo 2: ${dup.file2}\n\n`;
    });
  }
  
  // Dependências
  markdown += `## 🔗 Dependências Principais\n\n`;
  const dependencies = new Map();
  analysis.files.forEach(file => {
    file.imports.forEach(imp => {
      if (!dependencies.has(imp)) {
        dependencies.set(imp, []);
      }
      dependencies.get(imp).push(file.path);
    });
  });
  
  Array.from(dependencies.entries()).slice(0, 20).forEach(([dep, files]) => {
    markdown += `- **${dep}**\n`;
    markdown += `  - Usado por: ${files.slice(0, 3).join(', ')}${files.length > 3 ? '...' : ''}\n\n`;
  });
  
  fs.writeFileSync(path.join(reportDir, 'MAPA-MENTAL.md'), markdown);
}

/**
 * Obter nome amigável da categoria
 */
function getCategoryName(category) {
  const names = {
    'frontend-script': '📜 Scripts Frontend',
    'backend': '⚙️ Backend',
    'utility-script': '🛠️ Scripts Utilitários',
    'database': '💾 Banco de Dados',
    'public-asset': '🌐 Assets Públicos',
    'test': '🧪 Testes',
    'wellington': '📦 Wellington',
    'documentation': '📚 Documentação',
    'other': '📄 Outros'
  };
  return names[category] || category;
}

// Executar análise
console.log('🔍 Iniciando análise do projeto...\n');
walkDirectory(projectRoot);
console.log(`✅ ${analysis.files.length} arquivos analisados\n`);

console.log('🔍 Analisando ordem de carregamento...');
analyzeLoadOrder();

console.log('📝 Gerando relatórios...');
generateReport();

