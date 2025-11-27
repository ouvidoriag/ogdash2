/**
 * Configuração de Emails
 * Mapeamento de secretarias para emails corporativos
 */

import { isConcluido, getDataCriacao } from '../../utils/dateUtils.js';

/**
 * Mapeamento de secretarias para emails
 * Formato: { nomeSecretaria: 'email@dominio.gov.br' }
 */
export const SECRETARIAS_EMAILS = {
  // Secretaria de Saúde
  'Secretaria de Saúde': 'ouvgeral.gestao@gmail.com',
  'Secretaria de Saude': 'ouvgeral.gestao@gmail.com',
  'Saúde': 'ouvgeral.gestao@gmail.com',
  'Saude': 'ouvgeral.gestao@gmail.com',
  'SMS': 'ouvgeral.gestao@gmail.com', // Secretaria Municipal de Saúde
  
  // Adicionar mais secretarias aqui:
  // 'Secretaria de Educação': 'educacao@duquedecaxias.rj.gov.br',
  // 'Secretaria de Obras': 'obras@duquedecaxias.rj.gov.br',
};

/**
 * Email padrão para secretarias sem email cadastrado
 */
export const EMAIL_PADRAO = process.env.EMAIL_PADRAO_SECRETARIAS || 'ouvidoria@duquedecaxias.rj.gov.br';

/**
 * Email remetente (do sistema)
 */
export const EMAIL_REMETENTE = process.env.EMAIL_REMETENTE || 'ouvidoria@duquedecaxias.rj.gov.br';

/**
 * Nome do remetente
 */
export const NOME_REMETENTE = process.env.NOME_REMETENTE || 'Ouvidoria Geral de Duque de Caxias';

/**
 * Email da Ouvidoria Geral (recebe resumo diário)
 */
export const EMAIL_OUVIDORIA_GERAL = process.env.EMAIL_OUVIDORIA_GERAL || 'ouvgeral.gestao@gmail.com';

/**
 * Obter email de uma secretaria
 * @param {string} secretaria - Nome da secretaria
 * @returns {string} - Email da secretaria ou email padrão
 */
export function getEmailSecretaria(secretaria) {
  if (!secretaria) return EMAIL_PADRAO;
  
  const secretariaLower = secretaria.toLowerCase().trim();
  
  // Buscar correspondência exata
  for (const [nome, email] of Object.entries(SECRETARIAS_EMAILS)) {
    if (nome.toLowerCase().trim() === secretariaLower) {
      return email;
    }
  }
  
  // Buscar correspondência parcial (caso a secretaria tenha variações no nome)
  for (const [nome, email] of Object.entries(SECRETARIAS_EMAILS)) {
    if (secretariaLower.includes(nome.toLowerCase()) || 
        nome.toLowerCase().includes(secretariaLower)) {
      return email;
    }
  }
  
  return EMAIL_PADRAO;
}

/**
 * Contar manifestações não respondidas de uma secretaria
 */
async function contarManifestacoesNaoRespondidas(prisma, secretaria) {
  try {
    const records = await prisma.record.findMany({
      where: {
        orgaos: { contains: secretaria, mode: 'insensitive' }
      },
      select: {
        status: true,
        statusDemanda: true,
        dataDaConclusao: true,
        dataConclusaoIso: true,
        data: true
      }
    });
    
    let naoRespondidas = 0;
    for (const record of records) {
      // Usar função isConcluido para verificar
      if (!isConcluido(record)) {
        naoRespondidas++;
      }
    }
    
    return naoRespondidas;
  } catch (error) {
    console.error('Erro ao contar manifestações:', error);
    return 0;
  }
}

/**
 * Calcular data de vencimento baseado na data de criação e prazo
 */
function calcularDataVencimento(dataCriacao, prazo) {
  if (!dataCriacao) return null;
  const data = new Date(dataCriacao + 'T00:00:00');
  if (isNaN(data.getTime())) return null;
  data.setDate(data.getDate() + prazo);
  return data.toISOString().slice(0, 10);
}

/**
 * Formatar data para exibição (DD/MM/YYYY)
 */
function formatarData(dataStr) {
  if (!dataStr) return 'N/A';
  
  try {
    const date = new Date(dataStr + 'T00:00:00');
    if (isNaN(date.getTime())) return dataStr;
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (e) {
    return dataStr;
  }
}

/**
 * Template de email para notificação de 15 dias antes do vencimento
 */
export async function getTemplate15Dias(dados, prisma = null) {
  const { secretaria, protocolos = [] } = dados;
  
  // Se protocolos é um array, usar; senão, criar array com um único protocolo (compatibilidade)
  const listaProtocolos = Array.isArray(protocolos) ? protocolos : [dados];
  
  // Contar manifestações não respondidas
  let totalNaoRespondidas = 0;
  if (prisma && secretaria) {
    totalNaoRespondidas = await contarManifestacoesNaoRespondidas(prisma, secretaria);
  }
  
  // Criar tabela de protocolos
  const tabelaProtocolos = listaProtocolos.map(p => {
    const prazo = p.tipoManifestacao?.toLowerCase().includes('sic') ? 20 : 30;
    return `
      <tr style="border-bottom: 1px solid #e0e0e0;">
        <td style="padding: 12px; font-weight: bold; color: #667eea; font-size: 16px;">${p.protocolo || 'N/A'}</td>
        <td style="padding: 12px; color: #555;">${formatarData(p.dataVencimento)}</td>
        <td style="padding: 12px; color: #ff9800; font-weight: bold;">15 dias</td>
        <td style="padding: 12px; color: #666;">${prazo} dias</td>
      </tr>
    `;
  }).join('');
  
  const totalProtocolos = listaProtocolos.length;
  
  return {
    subject: `Ouvidoria Geral Informa - ${totalProtocolos} Protocolos Vencendo em 15 Dias`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { padding: 30px 20px; background: #fff; }
          .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .info { background: #e7f3ff; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
          .total { font-size: 32px; font-weight: bold; color: #dc3545; text-align: center; margin: 20px 0; }
          .cta { background: #667eea; color: white; padding: 15px 30px; text-align: center; border-radius: 5px; margin: 20px 0; }
          .cta a { color: white; text-decoration: none; font-weight: bold; }
          .protocolos-table { width: 100%; border-collapse: collapse; margin: 20px 0; background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .protocolos-table th { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; text-align: left; font-weight: bold; }
          .protocolos-table td { padding: 12px; }
          .protocolos-table tr:nth-child(even) { background: #f8f9fa; }
          .protocolo-destaque { font-weight: bold; color: #667eea; font-size: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🏛️ Ouvidoria Geral de Duque de Caxias</h2>
            <p>Sistema Automático de Notificações</p>
          </div>
          <div class="content">
            <div class="alert">
              <strong>⚠️ ATENÇÃO:</strong> Você possui manifestações vencendo em 15 dias!
            </div>
            
            <h3>Olá, ${secretaria}!</h3>
            
            <p style="font-size: 16px; margin: 20px 0;">
              <strong>Ouvidoria Geral informa:</strong> Você tem um total de <strong style="color: #dc3545; font-size: 24px;">${totalNaoRespondidas}</strong> manifestações cadastradas no setor em que é alocado e que <strong>não foram respondidas</strong> até o momento.
            </p>
            
            <div class="info">
              <p><strong>Secretaria Responsável:</strong> ${secretaria}</p>
              <p><strong>Total de Manifestações Não Respondidas:</strong> <strong style="color: #dc3545;">${totalNaoRespondidas}</strong></p>
              <p><strong>Protocolos Vencendo em 15 Dias:</strong> <strong style="color: #ff9800; font-size: 20px;">${totalProtocolos}</strong></p>
            </div>
            
            <h4 style="margin-top: 30px; color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
              📋 Protocolos com Vencimento em 15 Dias:
            </h4>
            
            <table class="protocolos-table">
              <thead>
                <tr>
                  <th>Protocolo</th>
                  <th>Data Vencimento</th>
                  <th>Dias Restantes</th>
                  <th>Prazo</th>
                </tr>
              </thead>
              <tbody>
                ${tabelaProtocolos}
              </tbody>
            </table>
            
            <div class="cta">
              <a href="https://colab.gov.br" target="_blank">🔗 Acesse o Colab.gov no serviço de Ouvidoria</a>
            </div>
            
            <p style="margin-top: 20px; font-weight: bold; color: #333;">
              Fique atento e verifique suas demandas pendentes!
            </p>
          </div>
          <div class="footer">
            <p>Este é um email automático do sistema de Ouvidoria Geral de Duque de Caxias.</p>
            <p>Por favor, não responda este email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Ouvidoria Geral de Duque de Caxias
Sistema Automático de Notificações

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Olá, ${secretaria}!

Ouvidoria Geral informa: Você tem um total de ${totalNaoRespondidas} manifestações cadastradas no setor em que é alocado e que não foram respondidas até o momento.

Secretaria Responsável: ${secretaria}
Total de Manifestações Não Respondidas: ${totalNaoRespondidas}
Protocolos Vencendo em 15 Dias: ${totalProtocolos}

📋 PROTOCOLOS COM VENCIMENTO EM 15 DIAS:

${listaProtocolos.map(p => {
  const prazo = p.tipoManifestacao?.toLowerCase().includes('sic') ? 20 : 30;
  return `Protocolo: ${p.protocolo || 'N/A'}
  Data Vencimento: ${formatarData(p.dataVencimento)}
  Dias Restantes: 15 dias
  Prazo: ${prazo} dias
  ──────────────────────────────────────`;
}).join('\n\n')}

🔗 Acesse o Colab.gov no serviço de Ouvidoria: https://colab.gov.br

Fique atento e verifique suas demandas pendentes!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Este é um email automático. Por favor, não responda.
    `.trim()
  };
}

/**
 * Template de email para notificação no dia do vencimento
 */
export async function getTemplateVencimento(dados, prisma = null) {
  const { secretaria, protocolos = [] } = dados;
  
  // Se protocolos é um array, usar; senão, criar array com um único protocolo (compatibilidade)
  const listaProtocolos = Array.isArray(protocolos) ? protocolos : [dados];
  const totalVencidasHoje = listaProtocolos.length;
  
  // Criar tabela de protocolos
  const tabelaProtocolos = listaProtocolos.map(p => {
    const prazo = p.tipoManifestacao?.toLowerCase().includes('sic') ? 20 : 30;
    return `
      <tr style="border-bottom: 1px solid #e0e0e0; background: #fff3cd;">
        <td style="padding: 12px; font-weight: bold; color: #dc3545; font-size: 16px;">${p.protocolo || 'N/A'}</td>
        <td style="padding: 12px; color: #dc3545; font-weight: bold;">${formatarData(p.dataVencimento)}</td>
        <td style="padding: 12px; color: #dc3545; font-weight: bold;">VENCE HOJE</td>
        <td style="padding: 12px; color: #666;">${prazo} dias</td>
      </tr>
    `;
  }).join('');
  
  return {
    subject: `🚨 URGENTE - ${totalVencidasHoje} Manifestações Vencidas Hoje`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { padding: 30px 20px; background: #fff; }
          .alert { background: #f8d7da; border-left: 4px solid #dc3545; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .info { background: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
          .total { font-size: 36px; font-weight: bold; color: #dc3545; text-align: center; margin: 20px 0; }
          .cta { background: #dc3545; color: white; padding: 15px 30px; text-align: center; border-radius: 5px; margin: 20px 0; }
          .cta a { color: white; text-decoration: none; font-weight: bold; }
          .protocolos-table { width: 100%; border-collapse: collapse; margin: 20px 0; background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .protocolos-table th { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 15px; text-align: left; font-weight: bold; }
          .protocolos-table td { padding: 12px; }
          .protocolos-table tr:nth-child(even) { background: #fff3cd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🚨 Ouvidoria Geral de Duque de Caxias</h2>
            <p>ALERTA CRÍTICO - Manifestações Vencidas</p>
          </div>
          <div class="content">
            <div class="alert">
              <strong>🚨 ATENÇÃO URGENTE:</strong> Manifestações venceram hoje!
            </div>
            
            <h3>Olá, ${secretaria}!</h3>
            
            <p style="font-size: 18px; margin: 20px 0; text-align: center;">
              <strong style="color: #dc3545; font-size: 28px;">${totalVencidasHoje} manifestações venceram hoje!</strong>
            </p>
            
            <div class="info">
              <p><strong>Secretaria Responsável:</strong> ${secretaria}</p>
              <p><strong>Total de Manifestações Vencidas Hoje:</strong> <strong style="color: #dc3545; font-size: 28px;">${totalVencidasHoje}</strong></p>
            </div>
            
            <h4 style="margin-top: 30px; color: #dc3545; border-bottom: 2px solid #dc3545; padding-bottom: 10px;">
              🚨 Protocolos Vencidos Hoje:
            </h4>
            
            <table class="protocolos-table">
              <thead>
                <tr>
                  <th>Protocolo</th>
                  <th>Data Vencimento</th>
                  <th>Status</th>
                  <th>Prazo</th>
                </tr>
              </thead>
              <tbody>
                ${tabelaProtocolos}
              </tbody>
            </table>
            
            <p style="font-size: 16px; font-weight: bold; color: #dc3545; margin: 20px 0; padding: 15px; background: #f8d7da; border-radius: 5px;">
              ⚠️ AÇÃO URGENTE NECESSÁRIA: Estas demandas devem ser respondidas IMEDIATAMENTE!
            </p>
            
            <div class="cta">
              <a href="https://colab.gov.br" target="_blank">🔗 Acesse o Colab.gov no serviço de Ouvidoria</a>
            </div>
          </div>
          <div class="footer">
            <p>Este é um email automático do sistema de Ouvidoria Geral de Duque de Caxias.</p>
            <p>Por favor, não responda este email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Ouvidoria Geral de Duque de Caxias
ALERTA CRÍTICO - Manifestações Vencidas

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Olá, ${secretaria}!

🚨 ATENÇÃO URGENTE: ${totalVencidasHoje} manifestações venceram hoje!

Secretaria Responsável: ${secretaria}
Total de Manifestações Vencidas Hoje: ${totalVencidasHoje}

🚨 PROTOCOLOS VENCIDOS HOJE:

${listaProtocolos.map(p => {
  const prazo = p.tipoManifestacao?.toLowerCase().includes('sic') ? 20 : 30;
  return `Protocolo: ${p.protocolo || 'N/A'}
  Data Vencimento: ${formatarData(p.dataVencimento)} (HOJE)
  Status: VENCE HOJE
  Prazo: ${prazo} dias
  ──────────────────────────────────────`;
}).join('\n\n')}

⚠️ AÇÃO URGENTE NECESSÁRIA: Estas demandas devem ser respondidas IMEDIATAMENTE!

🔗 Acesse o Colab.gov no serviço de Ouvidoria: https://colab.gov.br

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Este é um email automático. Por favor, não responda.
    `.trim()
  };
}

/**
 * Template de email para notificação 60 dias após vencimento
 */
export async function getTemplate60Dias(dados, prisma = null) {
  const { secretaria, protocolos = [] } = dados;
  
  // Se protocolos é um array, usar; senão, criar array com um único protocolo (compatibilidade)
  const listaProtocolos = Array.isArray(protocolos) ? protocolos : [dados];
  const totalExtrapoladas = listaProtocolos.length;
  
  // Calcular dias vencidos para cada protocolo
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  // Criar tabela de protocolos
  const tabelaProtocolos = listaProtocolos.map(p => {
    const prazo = p.tipoManifestacao?.toLowerCase().includes('sic') ? 20 : 30;
    const diasVencidos = p.diasRestantes ? Math.abs(p.diasRestantes) : 60;
    return `
      <tr style="border-bottom: 1px solid #e0e0e0; background: #f8f9fa;">
        <td style="padding: 12px; font-weight: bold; color: #6c757d; font-size: 16px;">${p.protocolo || 'N/A'}</td>
        <td style="padding: 12px; color: #666;">${formatarData(p.dataVencimento)}</td>
        <td style="padding: 12px; color: #dc3545; font-weight: bold;">${diasVencidos}+ dias</td>
        <td style="padding: 12px; color: #666;">${prazo} dias</td>
      </tr>
    `;
  }).join('');
  
  return {
    subject: `⚠️ ATENÇÃO - ${totalExtrapoladas} Manifestações Extrapolaram Todos os Prazos`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #6c757d 0%, #495057 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { padding: 30px 20px; background: #fff; }
          .alert { background: #d1ecf1; border-left: 4px solid #0c5460; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .info { background: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
          .total { font-size: 36px; font-weight: bold; color: #dc3545; text-align: center; margin: 20px 0; }
          .warning { background: #f8d7da; border-left: 4px solid #dc3545; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .protocolos-table { width: 100%; border-collapse: collapse; margin: 20px 0; background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .protocolos-table th { background: linear-gradient(135deg, #6c757d 0%, #495057 100%); color: white; padding: 15px; text-align: left; font-weight: bold; }
          .protocolos-table td { padding: 12px; }
          .protocolos-table tr:nth-child(even) { background: #f8f9fa; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>⚠️ Ouvidoria Geral de Duque de Caxias</h2>
            <p>Notificação de Manifestações Extrapoladas</p>
          </div>
          <div class="content">
            <div class="alert">
              <strong>⚠️ ATENÇÃO:</strong> Manifestações extrapolaram todos os prazos permitidos!
            </div>
            
            <h3>Olá, ${secretaria}!</h3>
            
            <p style="font-size: 16px; margin: 20px 0;">
              <strong>Ouvidoria Geral informa, atenção:</strong> Você possui um total de <strong style="color: #dc3545; font-size: 28px;">${totalExtrapoladas}</strong> manifestações <strong>sem resposta</strong> que <strong>extrapolaram todos os prazos permitidos</strong>.
            </p>
            
            <div class="warning">
              <p style="font-size: 16px; font-weight: bold; color: #721c24;">
                ⚠️ Informamos que a resposta é de responsabilidade do órgão respondente!
              </p>
            </div>
            
            <div class="info">
              <p><strong>Secretaria Responsável:</strong> ${secretaria}</p>
              <p><strong>Total de Manifestações Extrapoladas:</strong> <strong style="color: #dc3545; font-size: 28px;">${totalExtrapoladas}</strong></p>
              <p><strong>Dias Após Vencimento:</strong> Mais de 61 dias</p>
            </div>
            
            <h4 style="margin-top: 30px; color: #6c757d; border-bottom: 2px solid #6c757d; padding-bottom: 10px;">
              📋 Protocolos Extrapolados (Mais de 61 dias):
            </h4>
            
            <table class="protocolos-table">
              <thead>
                <tr>
                  <th>Protocolo</th>
                  <th>Data Vencimento</th>
                  <th>Dias Vencidos</th>
                  <th>Prazo</th>
                </tr>
              </thead>
              <tbody>
                ${tabelaProtocolos}
              </tbody>
            </table>
            
            <p style="margin-top: 20px; font-weight: bold; color: #333;">
              Por favor, verifique e responda estas manifestações o quanto antes.
            </p>
          </div>
          <div class="footer">
            <p>Este é um email automático do sistema de Ouvidoria Geral de Duque de Caxias.</p>
            <p>Por favor, não responda este email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Ouvidoria Geral de Duque de Caxias
Notificação de Manifestações Extrapoladas

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Olá, ${secretaria}!

Ouvidoria Geral informa, atenção: Você possui um total de ${totalExtrapoladas} manifestações sem resposta que extrapolaram todos os prazos permitidos.

⚠️ Informamos que a resposta é de responsabilidade do órgão respondente!

Secretaria Responsável: ${secretaria}
Total de Manifestações Extrapoladas: ${totalExtrapoladas}
Dias Após Vencimento: Mais de 61 dias

📋 PROTOCOLOS EXTRAPOLADOS (MAIS DE 61 DIAS):

${listaProtocolos.map(p => {
  const prazo = p.tipoManifestacao?.toLowerCase().includes('sic') ? 20 : 30;
  const diasVencidos = p.diasRestantes ? Math.abs(p.diasRestantes) : 60;
  return `Protocolo: ${p.protocolo || 'N/A'}
  Data Vencimento: ${formatarData(p.dataVencimento)}
  Dias Vencidos: ${diasVencidos}+ dias
  Prazo: ${prazo} dias
  ──────────────────────────────────────`;
}).join('\n\n')}

Por favor, verifique e responda estas manifestações o quanto antes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Este é um email automático. Por favor, não responda.
    `.trim()
  };
}

/**
 * Template de email RESUMO para Ouvidoria Geral
 * Envia resumo de TODAS as demandas vencendo hoje, separadas por secretaria
 */
export async function getTemplateResumoOuvidoriaGeral(dadosPorSecretaria, prisma = null) {
  const hoje = new Date();
  const hojeFormatado = hoje.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  // Calcular totais
  let totalGeral = 0;
  const secretariasComProtocolos = [];
  
  for (const [secretaria, protocolos] of Object.entries(dadosPorSecretaria)) {
    if (protocolos.length > 0) {
      totalGeral += protocolos.length;
      secretariasComProtocolos.push({ secretaria, protocolos, total: protocolos.length });
    }
  }
  
  // Ordenar por quantidade (mais protocolos primeiro)
  secretariasComProtocolos.sort((a, b) => b.total - a.total);
  
  // Criar seções por secretaria
  const secoesSecretarias = secretariasComProtocolos.map(({ secretaria, protocolos, total }) => {
    const tabelaProtocolos = protocolos.map(p => {
      const prazo = p.tipoManifestacao?.toLowerCase().includes('sic') ? 20 : 30;
      return `
        <tr style="border-bottom: 1px solid #e0e0e0;">
          <td style="padding: 10px; font-weight: bold; color: #dc3545; font-size: 14px;">${p.protocolo || 'N/A'}</td>
          <td style="padding: 10px; color: #555;">${formatarData(p.dataVencimento)}</td>
          <td style="padding: 10px; color: #dc3545; font-weight: bold;">VENCE HOJE</td>
          <td style="padding: 10px; color: #666;">${prazo} dias</td>
          <td style="padding: 10px; color: #666; font-size: 12px;">${p.assunto || 'N/A'}</td>
        </tr>
      `;
    }).join('');
    
    return `
      <div style="margin: 30px 0; border: 2px solid #dc3545; border-radius: 8px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 15px 20px;">
          <h3 style="margin: 0; font-size: 18px;">${secretaria}</h3>
          <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Total: <strong>${total} protocolos vencidos hoje</strong></p>
        </div>
        <div style="padding: 20px; background: #fff;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f8f9fa;">
                <th style="padding: 12px; text-align: left; font-weight: bold; color: #333; border-bottom: 2px solid #dc3545;">Protocolo</th>
                <th style="padding: 12px; text-align: left; font-weight: bold; color: #333; border-bottom: 2px solid #dc3545;">Data Vencimento</th>
                <th style="padding: 12px; text-align: left; font-weight: bold; color: #333; border-bottom: 2px solid #dc3545;">Status</th>
                <th style="padding: 12px; text-align: left; font-weight: bold; color: #333; border-bottom: 2px solid #dc3545;">Prazo</th>
                <th style="padding: 12px; text-align: left; font-weight: bold; color: #333; border-bottom: 2px solid #dc3545;">Assunto</th>
              </tr>
            </thead>
            <tbody>
              ${tabelaProtocolos}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }).join('');
  
  return {
    subject: `📊 Resumo Diário - ${totalGeral} Manifestações Vencidas Hoje (${hojeFormatado})`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { padding: 30px 20px; background: #fff; }
          .alert { background: #f8d7da; border-left: 4px solid #dc3545; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .info { background: #e7f3ff; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
          .total { font-size: 42px; font-weight: bold; color: #dc3545; text-align: center; margin: 20px 0; }
          .resumo-box { background: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>📊 Ouvidoria Geral de Duque de Caxias</h2>
            <p>Resumo Diário de Manifestações Vencidas</p>
            <p style="margin-top: 10px; font-size: 16px; opacity: 0.9;">Data: ${hojeFormatado}</p>
          </div>
          <div class="content">
            <div class="alert">
              <strong>🚨 ATENÇÃO:</strong> Resumo de todas as manifestações vencidas hoje, separadas por secretaria.
            </div>
            
            <h3>Olá, Ouvidor Geral!</h3>
            
            <div class="resumo-box">
              <p style="font-size: 18px; margin: 10px 0; text-align: center;">
                <strong>Total Geral de Manifestações Vencidas Hoje:</strong>
              </p>
              <p class="total">${totalGeral}</p>
              <p style="text-align: center; color: #666; margin-top: 10px;">
                Distribuídas em <strong>${secretariasComProtocolos.length}</strong> secretaria(s)
              </p>
            </div>
            
            <h4 style="margin-top: 30px; color: #dc3545; border-bottom: 2px solid #dc3545; padding-bottom: 10px; font-size: 20px;">
              📋 Manifestações Vencidas Hoje por Secretaria:
            </h4>
            
            ${secoesSecretarias}
            
            <div class="info" style="margin-top: 30px;">
              <p style="font-weight: bold; color: #333; margin-bottom: 10px;">📌 Informações Importantes:</p>
              <ul style="color: #555; line-height: 1.8;">
                <li>Este resumo contém todas as manifestações que venceram hoje (${hojeFormatado})</li>
                <li>As manifestações estão organizadas por secretaria responsável</li>
                <li>Cada secretaria também recebeu um email individual com seus protocolos</li>
                <li>É importante acompanhar o andamento das respostas</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>Este é um email automático do sistema de Ouvidoria Geral de Duque de Caxias.</p>
            <p>Enviado diariamente às 8h da manhã com o resumo das manifestações vencidas.</p>
            <p>Por favor, não responda este email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Ouvidoria Geral de Duque de Caxias
Resumo Diário de Manifestações Vencidas

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Data: ${hojeFormatado}

Olá, Ouvidor Geral!

🚨 ATENÇÃO: Resumo de todas as manifestações vencidas hoje, separadas por secretaria.

Total Geral de Manifestações Vencidas Hoje: ${totalGeral}
Distribuídas em ${secretariasComProtocolos.length} secretaria(s)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 MANIFESTAÇÕES VENCIDAS HOJE POR SECRETARIA:

${secretariasComProtocolos.map(({ secretaria, protocolos, total }) => {
  return `
${secretaria} - ${total} protocolos vencidos hoje

${protocolos.map(p => {
  const prazo = p.tipoManifestacao?.toLowerCase().includes('sic') ? 20 : 30;
  return `  Protocolo: ${p.protocolo || 'N/A'}
  Data Vencimento: ${formatarData(p.dataVencimento)} (HOJE)
  Status: VENCE HOJE
  Prazo: ${prazo} dias
  Assunto: ${p.assunto || 'N/A'}`;
}).join('\n\n')}

───────────────────────────────────────────
  `;
}).join('\n')}

📌 Informações Importantes:
- Este resumo contém todas as manifestações que venceram hoje (${hojeFormatado})
- As manifestações estão organizadas por secretaria responsável
- Cada secretaria também recebeu um email individual com seus protocolos
- É importante acompanhar o andamento das respostas

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Este é um email automático. Enviado diariamente às 8h da manhã.
Por favor, não responda este email.
    `.trim()
  };
}
