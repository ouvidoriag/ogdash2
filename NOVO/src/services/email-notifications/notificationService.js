/**
 * Serviço de Notificações por Email
 * Identifica demandas que precisam de notificação e envia emails
 */

import { getDataCriacao, isConcluido } from '../../utils/dateUtils.js';
import { sendEmail } from './gmailService.js';
import { 
  getEmailSecretaria, 
  EMAIL_REMETENTE, 
  NOME_REMETENTE,
  EMAIL_OUVIDORIA_GERAL,
  getTemplate15Dias,
  getTemplateVencimento,
  getTemplate60Dias,
  getTemplateResumoOuvidoriaGeral
} from './emailConfig.js';

/**
 * Obter prazo por tipo de manifestação
 */
function getPrazoPorTipo(tipoDeManifestacao) {
  if (!tipoDeManifestacao) return 30;
  
  const tipo = String(tipoDeManifestacao).toLowerCase().trim();
  
  if (tipo.includes('sic') || 
      tipo.includes('pedido de informação') || 
      tipo.includes('pedido de informacao') ||
      tipo.includes('informação') ||
      tipo.includes('informacao')) {
    return 20;
  }
  
  return 30;
}

/**
 * Calcula a data de vencimento baseado na data de criação e prazo em dias
 */
function calcularDataVencimentoComPrazo(dataCriacao, prazo) {
  if (!dataCriacao) return null;
  
  const data = new Date(dataCriacao + 'T00:00:00');
  
  if (isNaN(data.getTime())) return null;
  
  // Adicionar prazo em dias
  data.setDate(data.getDate() + prazo);
  
  return data.toISOString().slice(0, 10);
}

/**
 * Calcula dias restantes até o vencimento
 */
function calcularDiasRestantes(dataVencimento, hoje) {
  if (!dataVencimento) return null;
  
  const vencimento = new Date(dataVencimento + 'T00:00:00');
  if (isNaN(vencimento.getTime())) return null;
  
  const diff = vencimento - hoje;
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  return dias;
}

/**
 * Verificar se já foi enviada notificação do tipo especificado
 */
async function jaFoiNotificado(prisma, protocolo, tipoNotificacao) {
  const notificacao = await prisma.notificacaoEmail.findFirst({
    where: {
      protocolo: protocolo,
      tipoNotificacao: tipoNotificacao,
      status: 'enviado'
    }
  });
  
  return !!notificacao;
}

/**
 * Registrar notificação no banco
 */
async function registrarNotificacao(prisma, dados) {
  const {
    protocolo,
    secretaria,
    emailSecretaria,
    tipoNotificacao,
    dataVencimento,
    diasRestantes,
    messageId,
    status = 'enviado',
    mensagemErro = null
  } = dados;
  
  try {
    const notificacao = await prisma.notificacaoEmail.create({
      data: {
        protocolo,
        secretaria,
        emailSecretaria,
        tipoNotificacao,
        dataVencimento,
        diasRestantes,
        messageId,
        status,
        mensagemErro
      }
    });
    
    return notificacao;
  } catch (error) {
    console.error('❌ Erro ao registrar notificação:', error);
    throw error;
  }
}

/**
 * Buscar demandas que precisam de notificação de 15 dias
 */
async function buscarDemandas15Dias(prisma) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  // Data de vencimento em 15 dias
  const dataVencimento15Dias = new Date(hoje);
  dataVencimento15Dias.setDate(hoje.getDate() + 15);
  const dataVencimento15DiasStr = dataVencimento15Dias.toISOString().slice(0, 10);
  
  // Buscar todas as demandas não concluídas
  const records = await prisma.record.findMany({
    where: {
      OR: [
        { dataCriacaoIso: { not: null } },
        { dataDaCriacao: { not: null } }
      ]
    },
    select: {
      id: true,
      protocolo: true,
      dataCriacaoIso: true,
      dataDaCriacao: true,
      tipoDeManifestacao: true,
      tema: true,
      assunto: true,
      orgaos: true,
      status: true,
      statusDemanda: true,
      data: true
    }
  });
  
  const demandas = [];
  
  for (const record of records) {
    // Pular concluídos
    if (isConcluido(record)) continue;
    
    const dataCriacao = getDataCriacao(record);
    if (!dataCriacao) continue;
    
    const tipo = record.tipoDeManifestacao || 
                 (record.data && typeof record.data === 'object' ? record.data.tipo_de_manifestacao : null) ||
                 '';
    
    const prazo = getPrazoPorTipo(tipo);
    const dataVencimento = calcularDataVencimentoComPrazo(dataCriacao, prazo);
    if (!dataVencimento) continue;
    
    // Verificar se vence em 15 dias (com margem de 1 dia)
    if (dataVencimento === dataVencimento15DiasStr || 
        dataVencimento === calcularDataVencimentoComPrazo(hoje.toISOString().slice(0, 10), 15)) {
      
      const diasRestantes = calcularDiasRestantes(dataVencimento, hoje);
      
      // Verificar se já foi notificado
      const protocolo = record.protocolo || 
                        (record.data && typeof record.data === 'object' ? record.data.protocolo : null) ||
                        'N/A';
      
      if (await jaFoiNotificado(prisma, protocolo, '15_dias')) {
        continue;
      }
      
      const secretaria = record.orgaos || 
                        (record.data && typeof record.data === 'object' ? record.data.orgaos : null) ||
                        'N/A';
      
      const assunto = record.assunto || 
                     (record.data && typeof record.data === 'object' ? record.data.assunto : null) ||
                     '';
      
      demandas.push({
        protocolo,
        secretaria,
        dataVencimento,
        diasRestantes,
        assunto,
        tipoManifestacao: tipo
      });
    }
  }
  
  return demandas;
}

/**
 * Buscar demandas que vencem hoje
 */
async function buscarDemandasVencimentoHoje(prisma) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const hojeStr = hoje.toISOString().slice(0, 10);
  
  const records = await prisma.record.findMany({
    where: {
      OR: [
        { dataCriacaoIso: { not: null } },
        { dataDaCriacao: { not: null } }
      ]
    },
    select: {
      id: true,
      protocolo: true,
      dataCriacaoIso: true,
      dataDaCriacao: true,
      tipoDeManifestacao: true,
      tema: true,
      assunto: true,
      orgaos: true,
      status: true,
      statusDemanda: true,
      data: true
    }
  });
  
  const demandas = [];
  
  for (const record of records) {
    if (isConcluido(record)) continue;
    
    const dataCriacao = getDataCriacao(record);
    if (!dataCriacao) continue;
    
    const tipo = record.tipoDeManifestacao || 
                 (record.data && typeof record.data === 'object' ? record.data.tipo_de_manifestacao : null) ||
                 '';
    
    const prazo = getPrazoPorTipo(tipo);
    const dataVencimento = calcularDataVencimentoComPrazo(dataCriacao, prazo);
    if (!dataVencimento) continue;
    
    // Verificar se vence hoje
    if (dataVencimento === hojeStr) {
      const protocolo = record.protocolo || 
                        (record.data && typeof record.data === 'object' ? record.data.protocolo : null) ||
                        'N/A';
      
      if (await jaFoiNotificado(prisma, protocolo, 'vencimento')) {
        continue;
      }
      
      const secretaria = record.orgaos || 
                        (record.data && typeof record.data === 'object' ? record.data.orgaos : null) ||
                        'N/A';
      
      const assunto = record.assunto || 
                     (record.data && typeof record.data === 'object' ? record.data.assunto : null) ||
                     '';
      
      const diasRestantes = calcularDiasRestantes(dataVencimento, hoje);
      
      demandas.push({
        protocolo,
        secretaria,
        dataVencimento,
        diasRestantes,
        assunto,
        tipoManifestacao: tipo
      });
    }
  }
  
  return demandas;
}

/**
 * Buscar demandas vencidas há 60 dias
 */
async function buscarDemandas60DiasVencidas(prisma) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  // Data de vencimento há 60 dias
  const dataVencimento60Dias = new Date(hoje);
  dataVencimento60Dias.setDate(hoje.getDate() - 60);
  const dataVencimento60DiasStr = dataVencimento60Dias.toISOString().slice(0, 10);
  
  const records = await prisma.record.findMany({
    where: {
      OR: [
        { dataCriacaoIso: { not: null } },
        { dataDaCriacao: { not: null } }
      ]
    },
    select: {
      id: true,
      protocolo: true,
      dataCriacaoIso: true,
      dataDaCriacao: true,
      tipoDeManifestacao: true,
      tema: true,
      assunto: true,
      orgaos: true,
      status: true,
      statusDemanda: true,
      data: true
    }
  });
  
  const demandas = [];
  
  for (const record of records) {
    // Incluir apenas não concluídos
    if (isConcluido(record)) continue;
    
    const dataCriacao = getDataCriacao(record);
    if (!dataCriacao) continue;
    
    const tipo = record.tipoDeManifestacao || 
                 (record.data && typeof record.data === 'object' ? record.data.tipo_de_manifestacao : null) ||
                 '';
    
    const prazo = getPrazoPorTipo(tipo);
    const dataVencimento = calcularDataVencimentoComPrazo(dataCriacao, prazo);
    if (!dataVencimento) continue;
    
    // Verificar se venceu há 60 dias (com margem de 1 dia)
    if (dataVencimento === dataVencimento60DiasStr) {
      const protocolo = record.protocolo || 
                        (record.data && typeof record.data === 'object' ? record.data.protocolo : null) ||
                        'N/A';
      
      if (await jaFoiNotificado(prisma, protocolo, '60_dias_vencido')) {
        continue;
      }
      
      const secretaria = record.orgaos || 
                        (record.data && typeof record.data === 'object' ? record.data.orgaos : null) ||
                        'N/A';
      
      const assunto = record.assunto || 
                     (record.data && typeof record.data === 'object' ? record.data.assunto : null) ||
                     '';
      
      const diasRestantes = calcularDiasRestantes(dataVencimento, hoje);
      
      demandas.push({
        protocolo,
        secretaria,
        dataVencimento,
        diasRestantes,
        assunto,
        tipoManifestacao: tipo
      });
    }
  }
  
  return demandas;
}

/**
 * Enviar notificações de 15 dias (agrupadas por secretaria)
 */
export async function enviarNotificacoes15Dias(prisma) {
  console.log('📧 Buscando demandas para notificação de 15 dias...');
  
  const demandas = await buscarDemandas15Dias(prisma);
  console.log(`📧 Encontradas ${demandas.length} demandas para notificar (15 dias)`);
  
  // Agrupar por secretaria
  const porSecretaria = {};
  for (const demanda of demandas) {
    const secretaria = demanda.secretaria || 'N/A';
    if (!porSecretaria[secretaria]) {
      porSecretaria[secretaria] = [];
    }
    porSecretaria[secretaria].push(demanda);
  }
  
  const resultados = [];
  
  // Enviar um email por secretaria com todos os protocolos
  for (const [secretaria, protocolos] of Object.entries(porSecretaria)) {
    try {
      const emailSecretaria = getEmailSecretaria(secretaria);
      const template = await getTemplate15Dias({
        secretaria,
        protocolos: protocolos,
        totalNaoRespondidas: 0
      }, prisma);
      
      const { messageId } = await sendEmail(
        emailSecretaria,
        template.subject,
        template.html,
        template.text,
        EMAIL_REMETENTE,
        NOME_REMETENTE
      );
      
      // Registrar cada protocolo
      for (const demanda of protocolos) {
        await registrarNotificacao(prisma, {
          protocolo: demanda.protocolo,
          secretaria: demanda.secretaria,
          emailSecretaria,
          tipoNotificacao: '15_dias',
          dataVencimento: demanda.dataVencimento,
          diasRestantes: demanda.diasRestantes,
          messageId
        });
        
        resultados.push({
          protocolo: demanda.protocolo,
          status: 'enviado',
          tipo: '15_dias'
        });
      }
      
      console.log(`✅ Email enviado para ${secretaria}: ${protocolos.length} protocolos (15 dias)`);
    } catch (error) {
      console.error(`❌ Erro ao enviar notificação para ${secretaria}:`, error);
      
      // Registrar erros
      for (const demanda of protocolos) {
        await registrarNotificacao(prisma, {
          protocolo: demanda.protocolo,
          secretaria: demanda.secretaria,
          emailSecretaria: getEmailSecretaria(secretaria),
          tipoNotificacao: '15_dias',
          dataVencimento: demanda.dataVencimento,
          diasRestantes: demanda.diasRestantes,
          messageId: null,
          status: 'erro',
          mensagemErro: error.message
        });
        
        resultados.push({
          protocolo: demanda.protocolo,
          status: 'erro',
          tipo: '15_dias',
          erro: error.message
        });
      }
    }
  }
  
  return resultados;
}

/**
 * Enviar resumo para Ouvidoria Geral com todas as demandas vencendo hoje
 */
async function enviarResumoOuvidoriaGeral(porSecretaria, prisma) {
  // Verificar se há demandas para enviar
  const totalDemandas = Object.values(porSecretaria).reduce((sum, arr) => sum + arr.length, 0);
  
  if (totalDemandas === 0) {
    console.log('📧 Nenhuma demanda vencendo hoje - resumo não será enviado');
    return null;
  }
  
  try {
    console.log(`📧 Preparando resumo para Ouvidoria Geral: ${totalDemandas} demandas vencendo hoje`);
    
    const template = await getTemplateResumoOuvidoriaGeral(porSecretaria, prisma);
    
    const { messageId } = await sendEmail(
      EMAIL_OUVIDORIA_GERAL,
      template.subject,
      template.html,
      template.text,
      EMAIL_REMETENTE,
      NOME_REMETENTE
    );
    
    console.log(`✅ Resumo enviado para Ouvidoria Geral (${EMAIL_OUVIDORIA_GERAL}): ${totalDemandas} demandas`);
    
    return { messageId, totalDemandas };
  } catch (error) {
    console.error('❌ Erro ao enviar resumo para Ouvidoria Geral:', error);
    throw error;
  }
}

/**
 * Enviar notificações de vencimento (hoje) - agrupadas por secretaria
 */
export async function enviarNotificacoesVencimento(prisma) {
  console.log('📧 Buscando demandas para notificação de vencimento (hoje)...');
  
  const demandas = await buscarDemandasVencimentoHoje(prisma);
  console.log(`📧 Encontradas ${demandas.length} demandas para notificar (vencimento hoje)`);
  
  // Agrupar por secretaria
  const porSecretaria = {};
  for (const demanda of demandas) {
    const secretaria = demanda.secretaria || 'N/A';
    if (!porSecretaria[secretaria]) {
      porSecretaria[secretaria] = [];
    }
    porSecretaria[secretaria].push(demanda);
  }
  
  const resultados = [];
  
  // Enviar um email por secretaria com todos os protocolos
  for (const [secretaria, protocolos] of Object.entries(porSecretaria)) {
    try {
      const emailSecretaria = getEmailSecretaria(secretaria);
      const template = await getTemplateVencimento({
        secretaria,
        protocolos: protocolos
      }, prisma);
      
      const { messageId } = await sendEmail(
        emailSecretaria,
        template.subject,
        template.html,
        template.text,
        EMAIL_REMETENTE,
        NOME_REMETENTE
      );
      
      // Registrar cada protocolo
      for (const demanda of protocolos) {
        await registrarNotificacao(prisma, {
          protocolo: demanda.protocolo,
          secretaria: demanda.secretaria,
          emailSecretaria,
          tipoNotificacao: 'vencimento',
          dataVencimento: demanda.dataVencimento,
          diasRestantes: demanda.diasRestantes,
          messageId
        });
        
        resultados.push({
          protocolo: demanda.protocolo,
          status: 'enviado',
          tipo: 'vencimento'
        });
      }
      
      console.log(`✅ Email enviado para ${secretaria}: ${protocolos.length} protocolos (vencimento)`);
    } catch (error) {
      console.error(`❌ Erro ao enviar notificação para ${secretaria}:`, error);
      
      // Registrar erros
      for (const demanda of protocolos) {
        await registrarNotificacao(prisma, {
          protocolo: demanda.protocolo,
          secretaria: demanda.secretaria,
          emailSecretaria: getEmailSecretaria(secretaria),
          tipoNotificacao: 'vencimento',
          dataVencimento: demanda.dataVencimento,
          diasRestantes: demanda.diasRestantes,
          messageId: null,
          status: 'erro',
          mensagemErro: error.message
        });
        
        resultados.push({
          protocolo: demanda.protocolo,
          status: 'erro',
          tipo: 'vencimento',
          erro: error.message
        });
      }
    }
  }
  
  // Enviar resumo para Ouvidoria Geral após enviar emails individuais
  try {
    await enviarResumoOuvidoriaGeral(porSecretaria, prisma);
  } catch (error) {
    console.error('❌ Erro ao enviar resumo para Ouvidoria Geral (não bloqueia o processo):', error);
    // Não bloqueia o processo se o resumo falhar
  }
  
  return resultados;
}

/**
 * Enviar notificações de 60 dias vencidas - agrupadas por secretaria
 */
export async function enviarNotificacoes60Dias(prisma) {
  console.log('📧 Buscando demandas para notificação de 60 dias vencidas...');
  
  const demandas = await buscarDemandas60DiasVencidas(prisma);
  console.log(`📧 Encontradas ${demandas.length} demandas para notificar (60 dias vencidas)`);
  
  // Agrupar por secretaria
  const porSecretaria = {};
  for (const demanda of demandas) {
    const secretaria = demanda.secretaria || 'N/A';
    if (!porSecretaria[secretaria]) {
      porSecretaria[secretaria] = [];
    }
    porSecretaria[secretaria].push(demanda);
  }
  
  const resultados = [];
  
  // Enviar um email por secretaria com todos os protocolos
  for (const [secretaria, protocolos] of Object.entries(porSecretaria)) {
    try {
      const emailSecretaria = getEmailSecretaria(secretaria);
      const template = await getTemplate60Dias({
        secretaria,
        protocolos: protocolos
      }, prisma);
      
      const { messageId } = await sendEmail(
        emailSecretaria,
        template.subject,
        template.html,
        template.text,
        EMAIL_REMETENTE,
        NOME_REMETENTE
      );
      
      // Registrar cada protocolo
      for (const demanda of protocolos) {
        await registrarNotificacao(prisma, {
          protocolo: demanda.protocolo,
          secretaria: demanda.secretaria,
          emailSecretaria,
          tipoNotificacao: '60_dias_vencido',
          dataVencimento: demanda.dataVencimento,
          diasRestantes: demanda.diasRestantes,
          messageId
        });
        
        resultados.push({
          protocolo: demanda.protocolo,
          status: 'enviado',
          tipo: '60_dias_vencido'
        });
      }
      
      console.log(`✅ Email enviado para ${secretaria}: ${protocolos.length} protocolos (60 dias vencido)`);
    } catch (error) {
      console.error(`❌ Erro ao enviar notificação para ${secretaria}:`, error);
      
      // Registrar erros
      for (const demanda of protocolos) {
        await registrarNotificacao(prisma, {
          protocolo: demanda.protocolo,
          secretaria: demanda.secretaria,
          emailSecretaria: getEmailSecretaria(secretaria),
          tipoNotificacao: '60_dias_vencido',
          dataVencimento: demanda.dataVencimento,
          diasRestantes: demanda.diasRestantes,
          messageId: null,
          status: 'erro',
          mensagemErro: error.message
        });
        
        resultados.push({
          protocolo: demanda.protocolo,
          status: 'erro',
          tipo: '60_dias_vencido',
          erro: error.message
        });
      }
    }
  }
  
  return resultados;
}

/**
 * Executar todas as notificações
 */
export async function executarTodasNotificacoes(prisma) {
  console.log('📧 Iniciando processo de notificações por email...');
  
  const resultados = {
    '15_dias': [],
    'vencimento': [],
    '60_dias_vencido': [],
    totalEnviados: 0,
    totalErros: 0
  };
  
  try {
    // Notificações de 15 dias
    const notif15 = await enviarNotificacoes15Dias(prisma);
    resultados['15_dias'] = notif15;
    resultados.totalEnviados += notif15.filter(r => r.status === 'enviado').length;
    resultados.totalErros += notif15.filter(r => r.status === 'erro').length;
    
    // Notificações de vencimento
    const notifVenc = await enviarNotificacoesVencimento(prisma);
    resultados['vencimento'] = notifVenc;
    resultados.totalEnviados += notifVenc.filter(r => r.status === 'enviado').length;
    resultados.totalErros += notifVenc.filter(r => r.status === 'erro').length;
    
    // Notificações de 60 dias
    const notif60 = await enviarNotificacoes60Dias(prisma);
    resultados['60_dias_vencido'] = notif60;
    resultados.totalEnviados += notif60.filter(r => r.status === 'enviado').length;
    resultados.totalErros += notif60.filter(r => r.status === 'erro').length;
    
    console.log(`✅ Processo de notificações concluído: ${resultados.totalEnviados} enviados, ${resultados.totalErros} erros`);
    
    return resultados;
  } catch (error) {
    console.error('❌ Erro ao executar notificações:', error);
    throw error;
  }
}

