/**
 * Controller de Configurações Administrativas
 * Gerencia todas as configurações do sistema
 * 
 * CÉREBRO X-3
 * Data: 17/12/2025
 */

import { logger } from '../../utils/logger.js';
import Record from '../../models/Record.model.js';
import SecretariaInfo from '../../models/SecretariaInfo.model.js';
import NotificacaoEmail from '../../models/NotificacaoEmail.model.js';
import { MongoClient } from 'mongodb';

// Configurações padrão
const DEFAULT_CONFIG = {
  cache: {
    dashboardData: 5000,
    aggregateByMonth: 600000,
    distritos: 1800000,
    summary: 5000
  },
  notifications: {
    horario: '08:00',
    alertaPreventivo: 15,
    alertaCritico: 30,
    alertaExtrapolacao: 60,
    ativo: true,
    resumoDiario: true
  },
  sla: {
    padrao: 30,
    esic: 20,
    reclamacao: 30,
    denuncia: 30
  }
};

/**
 * GET /api/config
 * Retorna todas as configurações
 */
export async function getConfig(req, res) {
  try {
    // Chamar funções sem req/res para obter apenas os dados
    const cache = await getCacheConfig(null, null);
    const notifications = await getNotificationsConfig(null, null);
    const integrations = await getIntegrationsStatus(null, null);
    const sla = await getSLAConfig(null, null);
    
    // Para secretarias e system, buscar diretamente do banco
    let secretarias = [];
    let system = {};
    
    try {
      // Buscar secretarias diretamente - CORRIGIDO: usar 'name' ao invés de 'nome'
      const secretariasList = await SecretariaInfo.find({})
        .select('name acronym email alternateEmail phone phoneAlt address bairro district notes')
        .sort({ name: 1 })
        .lean();
      
      // Adicionar contagem de manifestações
      secretarias = await Promise.all(
        secretariasList.map(async (secretaria) => {
          const nomeSecretaria = secretaria.name || '';
          const count = await Record.countDocuments({
            $or: [
              { secretaria: { $regex: new RegExp(nomeSecretaria, 'i') } },
              { orgaos: { $regex: new RegExp(nomeSecretaria, 'i') } },
              { 'data.Secretaria': { $regex: new RegExp(nomeSecretaria, 'i') } }
            ]
          });
          return {
            _id: secretaria._id.toString(),
            id: secretaria._id.toString(),
            nome: secretaria.name || 'N/A',
            name: secretaria.name || 'N/A',
            acronym: secretaria.acronym || '',
            email: secretaria.email || '',
            emailAlternativo: secretaria.alternateEmail || '',
            alternateEmail: secretaria.alternateEmail || '',
            phone: secretaria.phone || '',
            phoneAlt: secretaria.phoneAlt || '',
            address: secretaria.address || '',
            bairro: secretaria.bairro || '',
            district: secretaria.district || '',
            notes: secretaria.notes || '',
            totalManifestacoes: count
          };
        })
      );
    } catch (err) {
      logger.warn('Erro ao obter secretarias em getConfig:', err);
    }
    
    try {
      // Buscar estatísticas diretamente
      const totalManifestacoes = await Record.countDocuments();
      const manifestacoesVencidas = await Record.countDocuments({
        statusDemanda: { $ne: 'Concluído' },
        dataVencimento: { $lt: new Date() }
      });
      const manifestacoesConcluidas = await Record.countDocuments({
        statusDemanda: 'Concluído'
      });

      // Notificações enviadas hoje
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const notificacoesEnviadas = await NotificacaoEmail.countDocuments({
        createdAt: { $gte: hoje },
        status: 'enviado'
      });

      system = {
        totalManifestacoes,
        manifestacoesVencidas,
        manifestacoesConcluidas,
        notificacoesEnviadas,
        cacheSize: 0,
        ultimaSincronizacao: new Date().toISOString()
      };
    } catch (err) {
      logger.warn('Erro ao obter system stats em getConfig:', err);
    }

    res.json({
      success: true,
      data: {
        cache: cache || DEFAULT_CONFIG.cache,
        notifications: notifications || DEFAULT_CONFIG.notifications,
        integrations: integrations || {},
        sla: sla || DEFAULT_CONFIG.sla,
        secretarias: secretarias || [],
        system: system || {}
      }
    });
  } catch (error) {
    logger.error('Erro ao obter configurações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter configurações',
      error: error.message
    });
  }
}

/**
 * GET /api/config/cache
 * Retorna configurações de cache
 */
export async function getCacheConfig(req, res) {
  try {
    // Por enquanto, retornar valores padrão
    // TODO: Implementar persistência no MongoDB
    const config = DEFAULT_CONFIG.cache;

    if (res) {
      res.json({
        success: true,
        data: config
      });
    } else {
      return config;
    }
  } catch (error) {
    logger.error('Erro ao obter configurações de cache:', error);
    if (res) {
      res.status(500).json({
        success: false,
        message: 'Erro ao obter configurações de cache',
        error: error.message
      });
    } else {
      throw error;
    }
  }
}

/**
 * POST /api/config/cache
 * Salva configurações de cache
 */
export async function saveCacheConfig(req, res) {
  try {
    const { dashboardData, aggregateByMonth, distritos, summary } = req.body;

    // Validar valores
    if (dashboardData && (dashboardData < 1000 || dashboardData > 3600000)) {
      return res.status(400).json({
        success: false,
        message: 'dashboardData deve estar entre 1000 e 3600000 ms'
      });
    }

    // TODO: Salvar no MongoDB
    // Por enquanto, apenas retornar sucesso
    logger.info('Configurações de cache atualizadas:', { dashboardData, aggregateByMonth, distritos, summary });

    res.json({
      success: true,
      message: 'Configurações de cache salvas com sucesso',
      data: {
        dashboardData: dashboardData || DEFAULT_CONFIG.cache.dashboardData,
        aggregateByMonth: aggregateByMonth || DEFAULT_CONFIG.cache.aggregateByMonth,
        distritos: distritos || DEFAULT_CONFIG.cache.distritos,
        summary: summary || DEFAULT_CONFIG.cache.summary
      }
    });
  } catch (error) {
    logger.error('Erro ao salvar configurações de cache:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao salvar configurações de cache',
      error: error.message
    });
  }
}

/**
 * POST /api/config/cache/clear
 * Limpa todo o cache
 */
export async function clearCache(req, res) {
  try {
    // TODO: Implementar limpeza de cache
    logger.info('Cache limpo manualmente');

    res.json({
      success: true,
      message: 'Cache limpo com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao limpar cache:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao limpar cache',
      error: error.message
    });
  }
}

/**
 * GET /api/config/notifications
 * Retorna configurações de notificações
 */
export async function getNotificationsConfig(req, res) {
  try {
    const config = DEFAULT_CONFIG.notifications;

    if (res) {
      res.json({
        success: true,
        data: config
      });
    } else {
      return config;
    }
  } catch (error) {
    logger.error('Erro ao obter configurações de notificações:', error);
    if (res) {
      res.status(500).json({
        success: false,
        message: 'Erro ao obter configurações de notificações',
        error: error.message
      });
    } else {
      throw error;
    }
  }
}

/**
 * POST /api/config/notifications
 * Salva configurações de notificações
 */
export async function saveNotificationsConfig(req, res) {
  try {
    const { horario, alertaPreventivo, alertaCritico, alertaExtrapolacao, ativo, resumoDiario } = req.body;

    // TODO: Salvar no MongoDB
    logger.info('Configurações de notificações atualizadas:', req.body);

    res.json({
      success: true,
      message: 'Configurações de notificações salvas com sucesso',
      data: {
        horario: horario || DEFAULT_CONFIG.notifications.horario,
        alertaPreventivo: alertaPreventivo || DEFAULT_CONFIG.notifications.alertaPreventivo,
        alertaCritico: alertaCritico || DEFAULT_CONFIG.notifications.alertaCritico,
        alertaExtrapolacao: alertaExtrapolacao || DEFAULT_CONFIG.notifications.alertaExtrapolacao,
        ativo: ativo !== undefined ? ativo : DEFAULT_CONFIG.notifications.ativo,
        resumoDiario: resumoDiario !== undefined ? resumoDiario : DEFAULT_CONFIG.notifications.resumoDiario
      }
    });
  } catch (error) {
    logger.error('Erro ao salvar configurações de notificações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao salvar configurações de notificações',
      error: error.message
    });
  }
}

/**
 * GET /api/config/integrations
 * Retorna status das integrações
 */
export async function getIntegrationsStatus(req, res) {
  try {
    const mongodbUrl = process.env.MONGODB_ATLAS_URL;
    const googleCredentials = process.env.GOOGLE_CREDENTIALS_FILE;
    const gmailCredentials = process.env.GMAIL_CREDENTIALS_FILE || 'config/gmail-credentials.json';
    const geminiKey = process.env.GEMINI_API_KEY;

    // Verificar MongoDB
    let mongodbStatus = 'unknown';
    try {
      const client = new MongoClient(mongodbUrl);
      await client.connect();
      await client.db().admin().ping();
      mongodbStatus = 'connected';
      await client.close();
    } catch (error) {
      mongodbStatus = 'error';
    }

    // Verificar Google Sheets
    const googleSheetsStatus = googleCredentials ? 'connected' : 'disconnected';

    // Verificar Gmail
    let gmailStatus = 'unknown';
    try {
      const fs = await import('fs');
      const path = await import('path');
      const { fileURLToPath } = await import('url');
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const gmailPath = path.join(__dirname, '..', gmailCredentials);
      if (fs.existsSync(gmailPath)) {
        gmailStatus = 'connected';
      } else {
        gmailStatus = 'disconnected';
      }
    } catch (error) {
      gmailStatus = 'error';
    }

    // Verificar Gemini
    const geminiStatus = geminiKey ? 'connected' : 'disconnected';

    const integrations = {
      googleSheets: {
        status: googleSheetsStatus,
        message: googleSheetsStatus === 'connected' ? 'Sincronização ativa' : 'Credenciais não configuradas'
      },
      gmail: {
        status: gmailStatus,
        message: gmailStatus === 'connected' ? 'API funcionando' : gmailStatus === 'disconnected' ? 'Credenciais não encontradas' : 'Erro na verificação'
      },
      gemini: {
        status: geminiStatus,
        message: geminiStatus === 'connected' ? 'Chat ativo' : 'API key não configurada'
      },
      mongodb: {
        status: mongodbStatus,
        message: mongodbStatus === 'connected' ? 'Conexão estabelecida' : mongodbStatus === 'error' ? 'Erro na conexão' : 'Status desconhecido'
      }
    };

    if (res) {
      res.json({
        success: true,
        data: integrations
      });
    } else {
      return integrations;
    }
  } catch (error) {
    logger.error('Erro ao obter status das integrações:', error);
    if (res) {
      res.status(500).json({
        success: false,
        message: 'Erro ao obter status das integrações',
        error: error.message
      });
    } else {
      throw error;
    }
  }
}

/**
 * GET /api/config/sla
 * Retorna configurações de SLA
 */
export async function getSLAConfig(req, res) {
  try {
    const config = DEFAULT_CONFIG.sla;

    if (res) {
      res.json({
        success: true,
        data: config
      });
    } else {
      return config;
    }
  } catch (error) {
    logger.error('Erro ao obter configurações de SLA:', error);
    if (res) {
      res.status(500).json({
        success: false,
        message: 'Erro ao obter configurações de SLA',
        error: error.message
      });
    } else {
      throw error;
    }
  }
}

/**
 * POST /api/config/sla
 * Salva configurações de SLA
 */
export async function saveSLAConfig(req, res) {
  try {
    const { padrao, esic, reclamacao, denuncia } = req.body;

    // TODO: Salvar no MongoDB
    logger.info('Configurações de SLA atualizadas:', req.body);

    res.json({
      success: true,
      message: 'Configurações de SLA salvas com sucesso',
      data: {
        padrao: padrao || DEFAULT_CONFIG.sla.padrao,
        esic: esic || DEFAULT_CONFIG.sla.esic,
        reclamacao: reclamacao || DEFAULT_CONFIG.sla.reclamacao,
        denuncia: denuncia || DEFAULT_CONFIG.sla.denuncia
      }
    });
  } catch (error) {
    logger.error('Erro ao salvar configurações de SLA:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao salvar configurações de SLA',
      error: error.message
    });
  }
}

/**
 * GET /api/config/secretarias
 * Retorna lista de secretarias com emails
 */
export async function getSecretariasList(req, res) {
  try {
    logger.debug('🔍 getSecretariasList: Buscando secretarias do banco...');
    
    const secretarias = await SecretariaInfo.find({})
      .select('name acronym email alternateEmail phone phoneAlt address bairro district notes')
      .sort({ name: 1 })
      .lean();

    logger.debug(`✅ getSecretariasList: Encontradas ${secretarias.length} secretarias`);

    if (secretarias.length === 0) {
      logger.warn('⚠️ getSecretariasList: Nenhuma secretaria encontrada no banco de dados');
      return res.json({
        success: true,
        data: [],
        message: 'Nenhuma secretaria encontrada. Execute o script de importação de secretarias.'
      });
    }

    // Log da primeira secretaria para debug
    if (secretarias[0]) {
      logger.debug('📋 getSecretariasList: Primeira secretaria (amostra):', {
        _id: secretarias[0]._id?.toString(),
        name: secretarias[0].name,
        email: secretarias[0].email,
        campos: Object.keys(secretarias[0])
      });
    }

    // Importar Record model
    const Record = (await import('../../models/Record.model.js')).default;

    // Adicionar contagem de manifestações
    const secretariasComContagem = await Promise.all(
      secretarias.map(async (secretaria) => {
        // Buscar por múltiplos campos possíveis
        const nomeSecretaria = secretaria.name || '';
        
        // Se não tem nome, tentar usar outros campos como fallback
        let nomeExibicao = nomeSecretaria;
        if (!nomeExibicao || nomeExibicao.trim() === '') {
          // Tentar usar acronym, email ou outros campos
          nomeExibicao = secretaria.acronym || 
                        secretaria.email?.split('@')[0] || 
                        `Secretaria ${secretaria._id.toString().slice(-6)}` ||
                        'N/A';
        }
        
        const count = await Record.countDocuments({
          $or: [
            { secretaria: { $regex: new RegExp(nomeSecretaria, 'i') } },
            { orgaos: { $regex: new RegExp(nomeSecretaria, 'i') } },
            { 'data.Secretaria': { $regex: new RegExp(nomeSecretaria, 'i') } }
          ]
        });

        const resultado = {
          _id: secretaria._id.toString(),
          id: secretaria._id.toString(),
          nome: nomeExibicao,
          name: secretaria.name || nomeExibicao,
          acronym: secretaria.acronym || '',
          email: secretaria.email || '',
          emailAlternativo: secretaria.alternateEmail || '',
          alternateEmail: secretaria.alternateEmail || '',
          phone: secretaria.phone || '',
          phoneAlt: secretaria.phoneAlt || '',
          address: secretaria.address || '',
          bairro: secretaria.bairro || '',
          district: secretaria.district || '',
          notes: secretaria.notes || '',
          totalManifestacoes: count
        };

        // Log se name está vazio
        if (!secretaria.name || secretaria.name.trim() === '') {
          logger.warn(`⚠️ getSecretariasList: Secretaria sem 'name' (ID: ${resultado._id}):`, {
            campos: Object.keys(secretaria),
            valores: secretaria
          });
        }

        return resultado;
      })
    );

    logger.debug(`✅ getSecretariasList: Retornando ${secretariasComContagem.length} secretarias processadas`);

    res.json({
      success: true,
      data: secretariasComContagem
    });
  } catch (error) {
    logger.error('❌ Erro ao obter lista de secretarias:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter lista de secretarias',
      error: error.message
    });
  }
}

/**
 * POST /api/config/secretarias/:id
 * Atualiza email de uma secretaria
 */
export async function updateSecretariaEmail(req, res) {
  try {
    const { id } = req.params;
    const { email, emailAlternativo, phone, phoneAlt, address, bairro, district, notes } = req.body;

    // Preparar objeto de atualização
    const updateData = {};
    if (email !== undefined) updateData.email = email || null;
    if (emailAlternativo !== undefined) updateData.alternateEmail = emailAlternativo || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (phoneAlt !== undefined) updateData.phoneAlt = phoneAlt || null;
    if (address !== undefined) updateData.address = address || null;
    if (bairro !== undefined) updateData.bairro = bairro || null;
    if (district !== undefined) updateData.district = district || null;
    if (notes !== undefined) updateData.notes = notes || null;

    const secretaria = await SecretariaInfo.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!secretaria) {
      return res.status(404).json({
        success: false,
        message: 'Secretaria não encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Informações da secretaria atualizadas com sucesso',
      data: secretaria
    });
  } catch (error) {
    logger.error('Erro ao atualizar email da secretaria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar email da secretaria',
      error: error.message
    });
  }
}

/**
 * POST /api/config/secretarias/:id/test-email
 * Testa envio de email para uma secretaria
 */
export async function testSecretariaEmail(req, res) {
  try {
    const { id } = req.params;
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido'
      });
    }

    const secretaria = await SecretariaInfo.findById(id);
    if (!secretaria) {
      return res.status(404).json({
        success: false,
        message: 'Secretaria não encontrada'
      });
    }

    // TODO: Implementar envio real de email de teste
    // Por enquanto, apenas validar
    logger.info(`Teste de email para secretaria ${secretaria.name}: ${email}`);

    res.json({
      success: true,
      message: 'Email de teste enviado com sucesso (simulado)',
      data: {
        secretaria: secretaria.name,
        email,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Erro ao testar email da secretaria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao testar email',
      error: error.message
    });
  }
}

/**
 * GET /api/config/system-stats
 * Retorna estatísticas do sistema
 */
export async function getSystemStats(req, res) {
  try {
    const totalManifestacoes = await Record.countDocuments();
    const manifestacoesVencidas = await Record.countDocuments({
      statusDemanda: { $ne: 'Concluído' },
      dataVencimento: { $lt: new Date() }
    });
    const manifestacoesConcluidas = await Record.countDocuments({
      statusDemanda: 'Concluído'
    });

    // Notificações enviadas hoje
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const notificacoesEnviadas = await NotificacaoEmail.countDocuments({
      createdAt: { $gte: hoje },
      status: 'enviado'
    });

    // Última sincronização (buscar do cache ou timestamp)
    const ultimaSincronizacao = new Date().toISOString(); // TODO: Buscar do cache real

    const stats = {
      totalManifestacoes,
      manifestacoesVencidas,
      manifestacoesConcluidas,
      notificacoesEnviadas,
      cacheSize: 0, // TODO: Calcular tamanho real do cache
      ultimaSincronizacao
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Erro ao obter estatísticas do sistema:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas do sistema',
      error: error.message
    });
  }
}

/**
 * POST /api/config/pipeline/execute
 * Executa o pipeline completo de atualização do banco de dados
 * - Executa pipeline Python (se disponível)
 * - Lê planilha tratada do Google Sheets
 * - Normaliza e atualiza banco de dados
 */
export async function executePipeline(req, res) {
  // Configurar timeout de 5 minutos (300000ms)
  const TIMEOUT_MS = 5 * 60 * 1000;
  const timeoutId = setTimeout(() => {
    if (!res.headersSent) {
      logger.error('❌ Timeout ao executar pipeline (5 minutos)');
      res.status(504).json({
        success: false,
        message: 'Timeout: Pipeline demorou mais de 5 minutos para executar',
        error: 'TIMEOUT',
        timestamp: new Date().toISOString()
      });
    }
  }, TIMEOUT_MS);

  try {
    logger.info('🚀 Iniciando pipeline completo de atualização do banco de dados...');
    
    // Configurar headers para manter conexão aberta
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no'); // Desabilitar buffering do nginx se presente
    
    // Enviar keep-alive para evitar timeout do navegador
    // Alguns navegadores fecham conexões após 60-120 segundos sem dados
    const keepAliveInterval = setInterval(() => {
      if (!res.headersSent && !res.destroyed) {
        // Não enviar nada, apenas manter conexão viva
        // O navegador manterá a conexão aberta
      } else {
        clearInterval(keepAliveInterval);
      }
    }, 30000); // A cada 30 segundos
    
    // Limpar intervalo quando terminar (em qualquer situação)
    const cleanupKeepAlive = () => {
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
      }
    };
    
    // Importar dinamicamente o script de atualização
    const { fileURLToPath } = await import('url');
    const pathModule = await import('path');
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    const path = pathModule.default || pathModule;
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const projectRoot = path.join(__dirname, '..', '..', '..');
    const pipelineScript = path.join(projectRoot, 'scripts', 'data', 'runPipeline.js');
    
    // Verificar se o script existe
    const fs = await import('fs');
    if (!fs.existsSync(pipelineScript)) {
      clearTimeout(timeoutId);
      cleanupKeepAlive();
      return res.status(404).json({
        success: false,
        message: 'Script de pipeline não encontrado',
        error: `Arquivo não encontrado: ${pipelineScript}`,
        timestamp: new Date().toISOString()
      });
    }
    
    logger.info(`📝 Executando pipeline: ${pipelineScript}`);
    
    // Executar o script do pipeline com timeout
    let stdout = '';
    let stderr = '';
    
    try {
      const result = await Promise.race([
        execAsync(`node "${pipelineScript}"`, {
          cwd: projectRoot,
          maxBuffer: 10 * 1024 * 1024, // 10MB
          env: { ...process.env }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('TIMEOUT')), TIMEOUT_MS - 1000)
        )
      ]);
      
      stdout = result.stdout || '';
      stderr = result.stderr || '';
    } catch (execError) {
      if (execError.message === 'TIMEOUT') {
        clearTimeout(timeoutId);
        cleanupKeepAlive();
        return res.status(504).json({
          success: false,
          message: 'Timeout: Pipeline demorou mais de 5 minutos para executar',
          error: 'TIMEOUT',
          timestamp: new Date().toISOString()
        });
      }
      throw execError;
    }
    
    clearTimeout(timeoutId);
    cleanupKeepAlive();
    
    // Capturar resultado
    const output = stdout || '';
    const errors = stderr || '';
    
    // Verificar se houve sucesso (procurar por mensagens de sucesso no output)
    const success = output.includes('PIPELINE CONCLUÍDO') || output.includes('✅') || output.includes('sucesso');
    const hasErrors = errors.includes('❌') || errors.includes('ERRO') || errors.includes('Error:');
    
    if (hasErrors && !success) {
      logger.error('❌ Erro detectado no pipeline:', errors.substring(0, 500));
      return res.status(500).json({
        success: false,
        message: 'Erro ao executar pipeline',
        error: errors.substring(0, 500) || 'Erro desconhecido',
        output: output.substring(0, 1000),
        timestamp: new Date().toISOString()
      });
    }
    
    // Extrair estatísticas do output
    const stats = {
      registrosProcessados: extractNumber(output, 'Registros processados'),
      registrosAtualizados: extractNumber(output, 'Atualizados no banco'),
      registrosInseridos: extractNumber(output, 'Inseridos no banco'),
      registrosSemMudancas: extractNumber(output, 'Sem mudanças'),
      totalNoBanco: extractNumber(output, 'Total no banco')
    };
    
    logger.info('✅ Pipeline executado com sucesso', stats);
    
    cleanupKeepAlive();
    
    if (res.headersSent) {
      logger.warn('⚠️ Resposta já enviada, não é possível enviar novamente');
      return;
    }
    
    res.json({
      success: true,
      message: 'Pipeline executado com sucesso',
      data: {
        output: output.substring(0, 2000), // Limitar tamanho
        stats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    clearTimeout(timeoutId);
    cleanupKeepAlive();
    
    if (res.headersSent) {
      logger.error('❌ Erro após resposta enviada:', error);
      return;
    }
    
    logger.error('❌ Erro ao executar pipeline:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao executar pipeline',
      error: error.message || 'Erro desconhecido',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Função auxiliar para extrair números do output
 */
function extractNumber(text, label) {
  const regex = new RegExp(`${label}[^\\d]*(\\d+)`, 'i');
  const match = text.match(regex);
  return match ? parseInt(match[1], 10) : 0;
}

