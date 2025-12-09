/**
 * Controller para Sincronização de Dados
 * Endpoints para atualização manual e status do scheduler
 * 
 * CÉREBRO X-3
 * Data: 2025-01-XX
 */

import {
  executarAtualizacaoManual,
  getStatusSchedulerAtualizacao
} from '../../services/data-sync/scheduler.js';
import { logger } from '../../utils/logger.js';

/**
 * POST /api/data-sync/execute
 * Executar atualização manual de dados do Google Sheets
 */
export async function executeDataSync(req, res) {
  try {
    logger.info('📊 Executando atualização manual de dados...');
    
    const resultado = await executarAtualizacaoManual();
    
    res.json({
      success: true,
      message: 'Atualização de dados executada com sucesso',
      resultado
    });
  } catch (error) {
    logger.error('❌ Erro ao executar atualização de dados:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * GET /api/data-sync/status
 * Obter status do scheduler de atualização
 */
export async function getDataSyncStatus(req, res) {
  try {
    const status = getStatusSchedulerAtualizacao();
    
    res.json({
      success: true,
      status
    });
  } catch (error) {
    logger.error('❌ Erro ao obter status do scheduler:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

