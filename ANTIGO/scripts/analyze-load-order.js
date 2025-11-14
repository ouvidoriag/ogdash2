/**
 * Script de Análise de Ordem de Carregamento
 * Identifica problemas de carregamento, bloqueios e dependências
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const issues = [];

/**
 * Analisar index.html para ordem de carregamento
 */
function analyzeIndexHtml() {
  const indexPath = path.join(projectRoot, 'public', 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.error('❌ index.html não encontrado');
    return;
  }
  
  const content = fs.readFileSync(indexPath, 'utf-8');
  
  // Extrair ordem de scripts
  const scriptRegex = /<script\s+src=["'](.+?)["']/g;
  const scripts = [];
  let match;
  while ((match = scriptRegex.exec(content)) !== null) {
    scripts.push(match[1]);
  }
  
  // Extrair scripts inline
  const inlineScriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/g;
  const inlineScripts = [];
  while ((match = inlineScriptRegex.exec(content)) !== null) {
    if (!match[0].includes('src=')) {
      const scriptContent = match[1];
      // Verificar se define variáveis globais
      const globalVars = scriptContent.match(/window\.(\w+)\s*=/g) || [];
      inlineScripts.push({
        content: scriptContent.substring(0, 200),
        globals: globalVars.map(v => v.match(/window\.(\w+)/)[1]),
        line: content.substring(0, match.index).split('\n').length
      });
    }
  }
  
  console.log('\n📜 ORDEM DE CARREGAMENTO DE SCRIPTS\n');
  console.log('='.repeat(60));
  scripts.forEach((script, index) => {
    console.log(`${(index + 1).toString().padStart(2, '0')}. ${script}`);
    
    // Verificar se arquivo existe
    const scriptPath = path.join(projectRoot, 'public', script.replace(/^\//, ''));
    if (!fs.existsSync(scriptPath)) {
      issues.push({
        type: 'missing-file',
        severity: 'error',
        message: `Script não encontrado: ${script}`,
        script: script,
        order: index + 1
      });
      console.log('   ❌ ARQUIVO NÃO ENCONTRADO!');
    } else {
      const stats = fs.statSync(scriptPath);
      console.log(`   ✅ ${(stats.size / 1024).toFixed(2)} KB`);
    }
  });
  
  console.log('\n📝 SCRIPTS INLINE\n');
  console.log('='.repeat(60));
  inlineScripts.forEach((script, index) => {
    console.log(`Script inline ${index + 1} (linha ~${script.line}):`);
    if (script.globals.length > 0) {
      console.log(`   Define globais: ${script.globals.join(', ')}`);
    }
    console.log(`   Preview: ${script.content.substring(0, 100)}...\n`);
  });
  
  // Analisar dependências
  analyzeDependencies(scripts);
  
  return { scripts, inlineScripts };
}

/**
 * Analisar dependências entre scripts
 */
function analyzeDependencies(scripts) {
  console.log('\n🔗 ANÁLISE DE DEPENDÊNCIAS\n');
  console.log('='.repeat(60));
  
  const scriptContents = new Map();
  
  // Carregar conteúdo de cada script
  scripts.forEach(script => {
    const scriptPath = path.join(projectRoot, 'public', script.replace(/^\//, ''));
    if (fs.existsSync(scriptPath)) {
      try {
        const content = fs.readFileSync(scriptPath, 'utf-8');
        scriptContents.set(script, content);
      } catch (e) {
        console.error(`Erro ao ler ${script}:`, e.message);
      }
    }
  });
  
  // Verificar dependências
  scripts.forEach((script, index) => {
    const content = scriptContents.get(script);
    if (!content) return;
    
    // Encontrar o que este script usa
    const uses = [];
    scripts.forEach((otherScript, otherIndex) => {
      if (otherIndex >= index) return; // Só verificar scripts anteriores
      
      const otherContent = scriptContents.get(otherScript);
      if (!otherContent) return;
      
      // Verificar se este script usa algo do outro
      const otherExports = extractExports(otherContent);
      const otherGlobals = extractGlobals(otherContent);
      
      otherExports.forEach(exp => {
        if (content.includes(exp)) {
          uses.push({ script: otherScript, type: 'export', name: exp });
        }
      });
      
      otherGlobals.forEach(glob => {
        if (content.includes(`window.${glob}`) || content.includes(glob)) {
          uses.push({ script: otherScript, type: 'global', name: glob });
        }
      });
    });
    
    if (uses.length > 0) {
      console.log(`\n${script}:`);
      uses.forEach(use => {
        console.log(`   ✅ Depende de ${use.script} (${use.type}: ${use.name})`);
      });
    }
    
    // Verificar se usa algo que vem depois (PROBLEMA!)
    scripts.forEach((otherScript, otherIndex) => {
      if (otherIndex <= index) return; // Só verificar scripts posteriores
      
      const otherContent = scriptContents.get(otherScript);
      if (!otherContent) return;
      
      const otherExports = extractExports(otherContent);
      const otherGlobals = extractGlobals(otherContent);
      
      otherExports.forEach(exp => {
        if (content.includes(exp)) {
          issues.push({
            type: 'load-order',
            severity: 'error',
            message: `${script} usa ${exp} de ${otherScript} que é carregado DEPOIS`,
            script: script,
            dependsOn: otherScript,
            export: exp
          });
          console.log(`   ❌ PROBLEMA: Usa ${exp} de ${otherScript} (carregado depois!)`);
        }
      });
      
      otherGlobals.forEach(glob => {
        if (content.includes(`window.${glob}`) && !content.includes(`window.${glob}\s*=`)) {
          issues.push({
            type: 'load-order',
            severity: 'warning',
            message: `${script} pode usar window.${glob} de ${otherScript} que é carregado depois`,
            script: script,
            dependsOn: otherScript,
            global: glob
          });
        }
      });
    });
  });
}

/**
 * Extrair exports de um arquivo
 */
function extractExports(content) {
  const exports = [];
  const exportRegex = /export\s+(?:default\s+)?(?:function|const|class|let|var|async\s+function)\s+(\w+)/g;
  let match;
  while ((match = exportRegex.exec(content)) !== null) {
    exports.push(match[1]);
  }
  return exports;
}

/**
 * Extrair variáveis globais
 */
function extractGlobals(content) {
  const globals = [];
  const globalRegex = /window\.(\w+)\s*=/g;
  let match;
  while ((match = globalRegex.exec(content)) !== null) {
    globals.push(match[1]);
  }
  return globals;
}

/**
 * Verificar bloqueios e problemas de performance
 */
function checkBlockingIssues() {
  console.log('\n⏱️ VERIFICAÇÃO DE BLOQUEIOS\n');
  console.log('='.repeat(60));
  
  const scriptsDir = path.join(projectRoot, 'public', 'scripts');
  if (!fs.existsSync(scriptsDir)) {
    console.error('❌ Diretório scripts não encontrado');
    return;
  }
  
  const files = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.js'));
  
  files.forEach(file => {
    const filePath = path.join(scriptsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').length;
    const size = fs.statSync(filePath).size;
    
    // Verificar se é síncrono e grande (pode bloquear)
    if (size > 100 * 1024 && !content.includes('async') && !content.includes('Promise')) {
      issues.push({
        type: 'blocking',
        severity: 'warning',
        message: `${file} é grande (${(size/1024).toFixed(2)} KB) e pode bloquear carregamento`,
        file: file,
        size: size
      });
      console.log(`⚠️  ${file}: ${(size/1024).toFixed(2)} KB - pode bloquear`);
    }
    
    // Verificar se há operações síncronas pesadas
    if (content.includes('JSON.parse') && !content.includes('async')) {
      const jsonParseCount = (content.match(/JSON\.parse/g) || []).length;
      if (jsonParseCount > 5) {
        issues.push({
          type: 'blocking',
          severity: 'warning',
          message: `${file} tem muitos JSON.parse síncronos (${jsonParseCount})`,
          file: file,
          count: jsonParseCount
        });
      }
    }
  });
}

/**
 * Gerar relatório
 */
function generateReport(scripts, inlineScripts) {
  const reportDir = path.join(projectRoot, 'analise-projeto');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const report = {
    timestamp: new Date().toISOString(),
    scripts: scripts,
    inlineScripts: inlineScripts.length,
    issues: issues,
    summary: {
      totalScripts: scripts.length,
      totalIssues: issues.length,
      errors: issues.filter(i => i.severity === 'error').length,
      warnings: issues.filter(i => i.severity === 'warning').length
    }
  };
  
  fs.writeFileSync(
    path.join(reportDir, 'analise-carregamento.json'),
    JSON.stringify(report, null, 2)
  );
  
  // Gerar relatório em Markdown
  let markdown = `# 🔄 ANÁLISE DE ORDEM DE CARREGAMENTO\n\n`;
  markdown += `*Gerado em: ${new Date().toLocaleString('pt-BR')}*\n\n`;
  
  markdown += `## 📊 Resumo\n\n`;
  markdown += `- Total de scripts: ${scripts.length}\n`;
  markdown += `- Scripts inline: ${inlineScripts.length}\n`;
  markdown += `- Problemas encontrados: ${issues.length}\n`;
  markdown += `  - Erros: ${report.summary.errors}\n`;
  markdown += `  - Avisos: ${report.summary.warnings}\n\n`;
  
  if (issues.length > 0) {
    markdown += `## ⚠️ Problemas Encontrados\n\n`;
    issues.forEach(issue => {
      markdown += `### ${issue.type.toUpperCase()} - ${issue.severity.toUpperCase()}\n\n`;
      markdown += `- **Arquivo:** ${issue.script || issue.file}\n`;
      markdown += `- **Mensagem:** ${issue.message}\n`;
      if (issue.dependsOn) {
        markdown += `- **Depende de:** ${issue.dependsOn}\n`;
      }
      markdown += `\n`;
    });
  }
  
  markdown += `## 📜 Ordem de Carregamento\n\n`;
  markdown += `\`\`\`\n`;
  scripts.forEach((script, index) => {
    markdown += `${(index + 1).toString().padStart(2, '0')}. ${script}\n`;
  });
  markdown += `\`\`\`\n`;
  
  fs.writeFileSync(
    path.join(reportDir, 'ANALISE-CARREGAMENTO.md'),
    markdown
  );
  
  console.log(`\n✅ Relatório salvo em: ${reportDir}`);
  console.log(`📄 Arquivos gerados:`);
  console.log(`   - analise-carregamento.json`);
  console.log(`   - ANALISE-CARREGAMENTO.md`);
}

// Executar análise
console.log('🔍 Analisando ordem de carregamento...\n');
const { scripts, inlineScripts } = analyzeIndexHtml();
checkBlockingIssues();
generateReport(scripts, inlineScripts);

if (issues.length > 0) {
  console.log(`\n⚠️  ${issues.length} problemas encontrados!`);
  console.log(`   Ver relatório em: analise-projeto/ANALISE-CARREGAMENTO.md`);
} else {
  console.log(`\n✅ Nenhum problema crítico encontrado!`);
}

