/**
 * Script para limpar arquivos antigos e obsoletos
 * 
 * Remove documentação antiga, backups temporários e logs
 * que não são mais necessários para o funcionamento do sistema
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const rootDir = path.join(projectRoot, '..');

// Arquivos de documentação antiga para remover (raiz)
const docsAntigas = [
  'BALANCO_COLAB.md',
  'PAGINAS_FALTANTES.md',
  'PLANO_MELHORIAS_PAGINAS.md',
  'VERIFICACAO_PAGINAS.md',
  'VERIFICACAO_ATUALIZACAO_COMPLETA_PAGINA.md',
  'VERIFICACAO_INTERLIGACAO_OVERVIEW.md',
  'AUDITORIA_COMPLETA_SISTEMA.md',
  'RELATORIO_FINAL_AUDITORIA.md',
  'ANALISE_FILTROS_GRAFICOS.md',
  'OTIMIZACOES_ADICIONAIS.md',
  'ANALISE_OTIMIZACOES.md',
  'ANALISE_COMPARATIVA_SISTEMAS.md',
  'CARDS_VISAO_GERAL.md',
  'CORRECOES_CRITICAS_APLICADAS.md',
  'DOCUMENTACAO_PAGINA_VENCIMENTO.md',
  'DOCUMENTACAO_SISTEMA_VENCIMENTOS.md',
];

// Scripts antigos para remover (ANTIGO/)
const scriptsAntigos = [
  path.join(rootDir, 'ANTIGO', 'stop-all-servers.ps1'),
  path.join(rootDir, 'ANTIGO', 'stop-all-servers.bat'),
  path.join(rootDir, 'ANTIGO', 'scripts', 'start-refactoring.js'),
];

// Backups temporários para remover
const backups = [
  'backup_status_demanda_tratada_*.csv',
  'backup_tempo_de_resolucao_tratada_*.csv',
  'backup_tratada_antes_patch.csv',
  'pipeline_tratamento.log',
];

// Logs para limpar (não remover, apenas limpar conteúdo)
const logs = [
  path.join(projectRoot, 'dashboard.log'),
];

function removeFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ Removido: ${filePath}`);
      return true;
    } else {
      console.log(`⚠️  Não encontrado: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Erro ao remover ${filePath}:`, error.message);
    return false;
  }
}

function clearLog(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '', 'utf-8');
      console.log(`✅ Limpo: ${filePath}`);
      return true;
    } else {
      console.log(`⚠️  Não encontrado: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Erro ao limpar ${filePath}:`, error.message);
    return false;
  }
}

function findBackupFiles(pattern) {
  const files = [];
  const dir = rootDir;
  
  if (fs.existsSync(dir)) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      if (item.startsWith('backup_') && item.endsWith('.csv')) {
        files.push(path.join(dir, item));
      }
    }
  }
  
  return files;
}

async function main() {
  console.log('🧹 Limpando arquivos antigos e obsoletos...\n');
  console.log('='.repeat(60));
  
  let removed = 0;
  let cleared = 0;
  let notFound = 0;
  
  // Remover documentação antiga
  console.log('\n📄 Removendo documentação antiga...');
  for (const doc of docsAntigas) {
    const filePath = path.join(rootDir, doc);
    if (removeFile(filePath)) {
      removed++;
    } else {
      notFound++;
    }
  }
  
  // Remover backups
  console.log('\n💾 Removendo backups temporários...');
  const backupFiles = findBackupFiles('backup_*.csv');
  for (const backup of backupFiles) {
    if (removeFile(backup)) {
      removed++;
    }
  }
  
  // Remover log do pipeline
  const pipelineLog = path.join(rootDir, 'pipeline_tratamento.log');
  if (removeFile(pipelineLog)) {
    removed++;
  } else {
    notFound++;
  }
  
  // Remover scripts antigos
  console.log('\n🗑️  Removendo scripts antigos...');
  for (const script of scriptsAntigos) {
    if (removeFile(script)) {
      removed++;
    } else {
      notFound++;
    }
  }
  
  // Limpar logs (não remover, apenas limpar conteúdo)
  console.log('\n📋 Limpando logs...');
  for (const log of logs) {
    if (clearLog(log)) {
      cleared++;
    } else {
      notFound++;
    }
  }
  
  // Remover PID se servidor não estiver rodando
  const pidFile = path.join(projectRoot, 'dashboard.pid');
  try {
    if (fs.existsSync(pidFile)) {
      const pid = parseInt(fs.readFileSync(pidFile, 'utf-8').trim());
      // Verificar se processo está rodando (simplificado - sempre remove)
      // Em produção, verificar se processo existe antes de remover
      console.log(`\n⚠️  Arquivo PID encontrado (${pid}). Não removendo automaticamente.`);
      console.log(`   Remova manualmente se o servidor não estiver rodando.`);
    }
  } catch (error) {
    // Ignorar
  }
  
  // Resumo
  console.log('\n' + '='.repeat(60));
  console.log('📊 Resumo da Limpeza:');
  console.log(`   ✅ Arquivos removidos: ${removed}`);
  console.log(`   🧹 Logs limpos: ${cleared}`);
  console.log(`   ⚠️  Não encontrados: ${notFound}`);
  console.log('='.repeat(60));
  console.log('\n✅ Limpeza concluída!');
  console.log('\n💡 Próximos passos:');
  console.log('   1. Verifique se o sistema ainda funciona corretamente');
  console.log('   2. Execute: npm start');
  console.log('   3. Teste as funcionalidades principais');
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erro na limpeza:', error);
    process.exit(1);
  });

