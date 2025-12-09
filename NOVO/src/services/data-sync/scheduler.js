/**
 * Scheduler para Atualização Automática de Dados do Google Sheets
 * Executa atualização diária dos dados às 10:00
 * 
 * CÉREBRO X-3
 * Data: 2025-01-XX
 */

import cron from 'node-cron';
import { fileURLToPath } from 'url';
import path from 'path';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let tarefaAgendada = null;

/**
 * Executar atualização de dados do Google Sheets
 */
async function executarAtualizacao() {
  console.log('⏰ Iniciando atualização automática de dados do Google Sheets...');
  
  try {
    // Executar o script de atualização como processo filho
    const scriptPath = path.join(__dirname, '../../../scripts/data/updateFromGoogleSheets.js');
    
    return new Promise((resolve, reject) => {
      const processo = spawn('node', [scriptPath], {
        cwd: path.join(__dirname, '../../../'),
        stdio: 'inherit', // Herdar stdout/stderr para ver logs
        shell: true
      });
      
      processo.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Atualização automática concluída com sucesso');
          resolve({ sucesso: true, codigo: code });
        } else {
          console.error(`❌ Atualização automática falhou com código ${code}`);
          reject(new Error(`Processo falhou com código ${code}`));
        }
      });
      
      processo.on('error', (error) => {
        console.error('❌ Erro ao executar atualização automática:', error);
        reject(error);
      });
    });
  } catch (error) {
    console.error('❌ Erro na atualização automática:', error);
    throw error;
  }
}

/**
 * Iniciar scheduler
 * Executa atualização diária às 10h da manhã
 * CÉREBRO X-3
 */
export function iniciarSchedulerAtualizacao() {
  if (tarefaAgendada) {
    console.log('⚠️ Scheduler de atualização já está em execução');
    return;
  }
  
  // Executar diariamente às 10h da manhã
  // Formato: segundo minuto hora dia mês dia-da-semana
  tarefaAgendada = cron.schedule('0 10 * * *', async () => {
    console.log('⏰ Executando atualização automática de dados (10h)...');
    await executarAtualizacao();
  }, {
    scheduled: true,
    timezone: 'America/Sao_Paulo'
  });
  
  console.log('✅ Scheduler de atualização de dados iniciado (execução diária às 10h)');
}

/**
 * Parar scheduler
 */
export function pararSchedulerAtualizacao() {
  if (tarefaAgendada) {
    tarefaAgendada.stop();
    tarefaAgendada = null;
    console.log('✅ Scheduler de atualização parado');
  }
}

/**
 * Executar atualização manual
 */
export async function executarAtualizacaoManual() {
  return await executarAtualizacao();
}

/**
 * Verificar status do scheduler
 */
export function getStatusSchedulerAtualizacao() {
  return {
    ativo: tarefaAgendada !== null,
    proximaExecucao: tarefaAgendada ? 'Diariamente às 10h (horário de Brasília)' : 'Não agendado'
  };
}

