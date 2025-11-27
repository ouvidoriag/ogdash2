/**
 * Serviço de Integração com Gmail API
 * Envia emails usando a Gmail API do Google
 */

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração OAuth2
const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];
const TOKEN_PATH = path.join(__dirname, '../../..', 'config', 'gmail-token.json');
const CREDENTIALS_PATH = path.join(__dirname, '../../..', 'config', 'gmail-credentials.json');

let oauth2Client = null;
let gmail = null;

/**
 * Carregar credenciais do arquivo
 */
function loadCredentials() {
  try {
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      throw new Error(`Arquivo de credenciais não encontrado: ${CREDENTIALS_PATH}`);
    }
    
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    
    oauth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );
    
    return oauth2Client;
  } catch (error) {
    console.error('❌ Erro ao carregar credenciais do Gmail:', error);
    throw error;
  }
}

/**
 * Carregar token salvo
 */
function loadToken() {
  try {
    if (fs.existsSync(TOKEN_PATH)) {
      const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
      oauth2Client.setCredentials(token);
      return token;
    }
    return null;
  } catch (error) {
    console.error('❌ Erro ao carregar token:', error);
    return null;
  }
}

/**
 * Salvar token
 */
function saveToken(token) {
  try {
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2));
    console.log('✅ Token salvo com sucesso');
  } catch (error) {
    console.error('❌ Erro ao salvar token:', error);
    throw error;
  }
}

/**
 * Obter URL de autorização
 */
export function getAuthUrl() {
  const auth = loadCredentials();
  
  return auth.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
}

/**
 * Autorizar com código
 */
export async function authorize(code) {
  try {
    const auth = loadCredentials();
    const { tokens } = await auth.getToken(code);
    auth.setCredentials(tokens);
    saveToken(tokens);
    
    gmail = google.gmail({ version: 'v1', auth });
    return tokens;
  } catch (error) {
    console.error('❌ Erro ao autorizar:', error);
    throw error;
  }
}

/**
 * Inicializar cliente Gmail
 */
function initGmail() {
  if (gmail) return gmail;
  
  try {
    const auth = loadCredentials();
    const token = loadToken();
    
    if (!token) {
      throw new Error('Token não encontrado. Execute a autorização primeiro.');
    }
    
    auth.setCredentials(token);
    
    // Verificar se o token expirou e renovar se necessário
    auth.on('tokens', (tokens) => {
      if (tokens.refresh_token) {
        saveToken({ ...token, ...tokens });
      }
    });
    
    gmail = google.gmail({ version: 'v1', auth });
    return gmail;
  } catch (error) {
    console.error('❌ Erro ao inicializar Gmail:', error);
    throw error;
  }
}

/**
 * Criar mensagem MIME para envio
 */
function createMessage(to, subject, htmlBody, textBody, fromEmail, fromName) {
  const message = [
    `From: ${fromName} <${fromEmail}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="boundary123"`,
    ``,
    `--boundary123`,
    `Content-Type: text/plain; charset=UTF-8`,
    ``,
    textBody,
    ``,
    `--boundary123`,
    `Content-Type: text/html; charset=UTF-8`,
    ``,
    htmlBody,
    ``,
    `--boundary123--`
  ].join('\n');
  
  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Enviar email
 * @param {string} to - Email do destinatário
 * @param {string} subject - Assunto do email
 * @param {string} htmlBody - Corpo HTML do email
 * @param {string} textBody - Corpo texto do email
 * @param {string} fromEmail - Email do remetente (opcional)
 * @param {string} fromName - Nome do remetente (opcional)
 * @returns {Promise<{messageId: string, threadId: string}>}
 */
export async function sendEmail(to, subject, htmlBody, textBody, fromEmail = null, fromName = null) {
  try {
    const gmailClient = initGmail();
    
    // Usar configurações padrão se não fornecidas
    const emailRemetente = fromEmail || process.env.EMAIL_REMETENTE || 'ouvidoria@duquedecaxias.rj.gov.br';
    const nomeRemetente = fromName || process.env.NOME_REMETENTE || 'Ouvidoria Geral de Duque de Caxias';
    
    const rawMessage = createMessage(to, subject, htmlBody, textBody, emailRemetente, nomeRemetente);
    
    const response = await gmailClient.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: rawMessage
      }
    });
    
    console.log('✅ Email enviado com sucesso:', {
      to,
      subject,
      messageId: response.data.id,
      threadId: response.data.threadId
    });
    
    return {
      messageId: response.data.id,
      threadId: response.data.threadId
    };
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    throw error;
  }
}

/**
 * Verificar se o serviço está autorizado
 */
export function isAuthorized() {
  try {
    return fs.existsSync(TOKEN_PATH) && fs.existsSync(CREDENTIALS_PATH);
  } catch (error) {
    return false;
  }
}

/**
 * Verificar status da autorização
 */
export async function checkAuthStatus() {
  try {
    if (!isAuthorized()) {
      return {
        authorized: false,
        message: 'Serviço não autorizado. Execute a autorização primeiro.'
      };
    }
    
    const gmailClient = initGmail();
    const profile = await gmailClient.users.getProfile({ userId: 'me' });
    
    return {
      authorized: true,
      email: profile.data.emailAddress,
      message: 'Serviço autorizado e funcionando'
    };
  } catch (error) {
    return {
      authorized: false,
      message: `Erro ao verificar autorização: ${error.message}`
    };
  }
}

