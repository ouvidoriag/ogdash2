/**
 * Controller de Notificações por Email
 * Gerencia endpoints para notificações
 */

import { 
  executarTodasNotificacoes,
  enviarNotificacoes15Dias,
  enviarNotificacoesVencimento,
  enviarNotificacoes60Dias
} from '../../services/email-notifications/notificationService.js';
import { 
  getAuthUrl, 
  authorize, 
  checkAuthStatus,
  isAuthorized 
} from '../../services/email-notifications/gmailService.js';
import { getEmailSecretaria, SECRETARIAS_EMAILS } from '../../services/email-notifications/emailConfig.js';
import { executarVerificacaoManual, getStatusScheduler } from '../../services/email-notifications/scheduler.js';

/**
 * GET /api/notifications/auth/url
 * Obter URL de autorização do Gmail
 */
export async function getAuthUrlEndpoint(req, res) {
  try {
    const authUrl = getAuthUrl();
    res.json({
      success: true,
      authUrl,
      message: 'Acesse a URL para autorizar o acesso ao Gmail'
    });
  } catch (error) {
    console.error('❌ Erro ao obter URL de autorização:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * POST /api/notifications/auth/callback
 * Processar callback de autorização
 */
export async function authCallback(req, res) {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Código de autorização não fornecido'
      });
    }
    
    const tokens = await authorize(code);
    
    res.json({
      success: true,
      message: 'Autorização realizada com sucesso',
      tokens: {
        access_token: tokens.access_token ? '***' : null,
        refresh_token: tokens.refresh_token ? '***' : null
      }
    });
  } catch (error) {
    console.error('❌ Erro ao processar autorização:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * GET /api/notifications/auth/status
 * Verificar status da autorização
 */
export async function getAuthStatus(req, res) {
  try {
    const status = await checkAuthStatus();
    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    console.error('❌ Erro ao verificar status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * POST /api/notifications/execute
 * Executar notificações manualmente
 */
export async function executeNotifications(req, res, prisma) {
  try {
    if (!isAuthorized()) {
      return res.status(403).json({
        success: false,
        error: 'Serviço não autorizado. Execute a autorização primeiro.'
      });
    }
    
    const { tipo } = req.body; // '15_dias' | 'vencimento' | '60_dias' | 'todas'
    
    let resultados;
    
    if (tipo === '15_dias') {
      resultados = await enviarNotificacoes15Dias(prisma);
    } else if (tipo === 'vencimento') {
      resultados = await enviarNotificacoesVencimento(prisma);
    } else if (tipo === '60_dias') {
      resultados = await enviarNotificacoes60Dias(prisma);
    } else {
      resultados = await executarTodasNotificacoes(prisma);
    }
    
    res.json({
      success: true,
      resultados,
      totalEnviados: resultados.totalEnviados || resultados.filter(r => r.status === 'enviado').length,
      totalErros: resultados.totalErros || resultados.filter(r => r.status === 'erro').length
    });
  } catch (error) {
    console.error('❌ Erro ao executar notificações:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * GET /api/notifications/history
 * Obter histórico de notificações
 */
export async function getNotificationHistory(req, res, prisma) {
  try {
    const { 
      protocolo, 
      secretaria, 
      tipoNotificacao, 
      status,
      limit = 100,
      offset = 0
    } = req.query;
    
    const where = {};
    if (protocolo) where.protocolo = protocolo;
    if (secretaria) where.secretaria = { contains: secretaria, mode: 'insensitive' };
    if (tipoNotificacao) where.tipoNotificacao = tipoNotificacao;
    if (status) where.status = status;
    
    const [notificacoes, total] = await Promise.all([
      prisma.notificacaoEmail.findMany({
        where,
        orderBy: { enviadoEm: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.notificacaoEmail.count({ where })
    ]);
    
    res.json({
      success: true,
      notificacoes,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('❌ Erro ao obter histórico:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * GET /api/notifications/stats
 * Obter estatísticas de notificações
 */
export async function getNotificationStats(req, res, prisma) {
  try {
    const { periodo = 30 } = req.query; // Últimos N dias
    
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - parseInt(periodo));
    
    const [total, porTipo, porStatus, porSecretaria] = await Promise.all([
      prisma.notificacaoEmail.count({
        where: { enviadoEm: { gte: dataLimite } }
      }),
      prisma.notificacaoEmail.groupBy({
        by: ['tipoNotificacao'],
        where: { enviadoEm: { gte: dataLimite } },
        _count: { _all: true }
      }),
      prisma.notificacaoEmail.groupBy({
        by: ['status'],
        where: { enviadoEm: { gte: dataLimite } },
        _count: { _all: true }
      }),
      prisma.notificacaoEmail.groupBy({
        by: ['secretaria'],
        where: { enviadoEm: { gte: dataLimite } },
        _count: { _all: true },
        orderBy: { _count: { _all: 'desc' } },
        take: 10
      })
    ]);
    
    res.json({
      success: true,
      periodo: parseInt(periodo),
      total,
      porTipo: porTipo.map(item => ({
        tipo: item.tipoNotificacao,
        quantidade: item._count._all
      })),
      porStatus: porStatus.map(item => ({
        status: item.status,
        quantidade: item._count._all
      })),
      topSecretarias: porSecretaria.map(item => ({
        secretaria: item.secretaria,
        quantidade: item._count._all
      }))
    });
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * GET /api/notifications/config
 * Obter configuração de emails
 */
export async function getEmailConfig(req, res) {
  try {
    res.json({
      success: true,
      secretarias: SECRETARIAS_EMAILS,
      emailPadrao: process.env.EMAIL_PADRAO_SECRETARIAS || 'ouvidoria@duquedecaxias.rj.gov.br',
      emailRemetente: process.env.EMAIL_REMETENTE || 'ouvidoria@duquedecaxias.rj.gov.br',
      nomeRemetente: process.env.NOME_REMETENTE || 'Ouvidoria Geral de Duque de Caxias'
    });
  } catch (error) {
    console.error('❌ Erro ao obter configuração:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * GET /api/notifications/scheduler/status
 * Obter status do scheduler
 */
export async function getSchedulerStatus(req, res) {
  try {
    const status = getStatusScheduler();
    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    console.error('❌ Erro ao obter status do scheduler:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * POST /api/notifications/scheduler/execute
 * Executar verificação manual do scheduler
 */
export async function executeSchedulerManual(req, res, prisma) {
  try {
    if (!isAuthorized()) {
      return res.status(403).json({
        success: false,
        error: 'Serviço não autorizado. Execute a autorização primeiro.'
      });
    }
    
    const resultados = await executarVerificacaoManual();
    
    res.json({
      success: true,
      resultados
    });
  } catch (error) {
    console.error('❌ Erro ao executar scheduler:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * GET /api/notifications/test
 * Testar envio de email manualmente
 */
export async function testEmail(req, res) {
  try {
    if (!isAuthorized()) {
      return res.status(403).json({
        success: false,
        error: 'Serviço não autorizado. Execute a autorização primeiro.'
      });
    }
    
    const { email } = req.query;
    const emailDestino = email || process.env.EMAIL_REMETENTE || 'teste@exemplo.com';
    
    const { sendEmail } = await import('../../services/email-notifications/gmailService.js');
    const { EMAIL_REMETENTE, NOME_REMETENTE } = await import('../../services/email-notifications/emailConfig.js');
    
    await sendEmail(
      emailDestino,
      'Teste de Vencimento - Sistema Automático',
      `
        <h1>✅ Teste de Email Funcionou!</h1>
        <p>Este é um email de teste do sistema automático de vencimentos.</p>
        <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
        <p>Se você recebeu este email, o sistema está funcionando corretamente! 🎉</p>
      `,
      `Teste de Email - Sistema Automático de Vencimentos\n\nEste é um email de teste.\nData: ${new Date().toLocaleString('pt-BR')}\n\nSe você recebeu este email, o sistema está funcionando corretamente!`,
      EMAIL_REMETENTE,
      NOME_REMETENTE
    );
    
    res.json({
      success: true,
      message: `Email de teste enviado para ${emailDestino}`,
      data: new Date().toLocaleString('pt-BR')
    });
  } catch (error) {
    console.error('❌ Erro ao enviar email de teste:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

