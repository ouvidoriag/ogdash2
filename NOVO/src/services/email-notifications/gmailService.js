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

/**
 * Resolver caminho do arquivo de configuração
 * Tenta múltiplos caminhos possíveis para funcionar tanto no servidor quanto nos scripts
 */
function resolveConfigPath(filename) {
  // Tentar caminho relativo ao módulo (servidor)
  const modulePath = path.join(__dirname, '../../..', 'config', filename);
  if (fs.existsSync(modulePath)) {
    return modulePath;
  }
  
  // Tentar caminho relativo ao diretório de trabalho atual (scripts)
  const cwdPath = path.join(process.cwd(), 'config', filename);
  if (fs.existsSync(cwdPath)) {
    return cwdPath;
  }
  
  // Tentar caminho relativo ao NOVO (se executado da raiz)
  const novoPath = path.join(process.cwd(), 'NOVO', 'config', filename);
  if (fs.existsSync(novoPath)) {
    return novoPath;
  }
  
  // Se não encontrou, retornar o caminho padrão (relativo ao módulo)
  return modulePath;
}

// Configuração OAuth2
const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];
const TOKEN_PATH = resolveConfigPath('gmail-token.json');
const CREDENTIALS_PATH = resolveConfigPath('gmail-credentials.json');

let oauth2Client = null;
let gmail = null;

/**
 * Carregar credenciais do arquivo
 */
function loadCredentials() {
  try {
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      console.error('❌ Arquivo de credenciais não encontrado em:', CREDENTIALS_PATH);
      console.error('💡 Verifique se o arquivo config/gmail-credentials.json existe');
      console.error('💡 Diretório de trabalho atual:', process.cwd());
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
      
      // Verificar se o token tem refresh_token
      if (!token.refresh_token) {
        console.warn('⚠️ Token não possui refresh_token. Pode ser necessário reautorizar.');
      }
      
      oauth2Client.setCredentials(token);
      return token;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Erro ao carregar token:', error);
    console.error('💡 Caminho do token:', TOKEN_PATH);
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
 * Inicializar cliente Gmail com renovação automática de token
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
    
    // Configurar renovação automática de token
    auth.on('tokens', (tokens) => {
      if (tokens.refresh_token) {
        // Salvar novo refresh token se fornecido
        const updatedToken = { ...token, ...tokens };
        saveToken(updatedToken);
      } else if (tokens.access_token) {
        // Atualizar apenas o access token
        const updatedToken = { ...token, access_token: tokens.access_token, expiry_date: tokens.expiry_date };
        saveToken(updatedToken);
      }
    });
    
    // Forçar renovação se o token estiver próximo de expirar
    if (token.expiry_date && token.expiry_date <= Date.now() + 60000) {
      auth.refreshAccessToken().catch(err => {
        console.error('❌ Erro ao renovar token:', err);
      });
    }
    
    gmail = google.gmail({ version: 'v1', auth });
    return gmail;
  } catch (error) {
    console.error('❌ Erro ao inicializar Gmail:', error);
    throw error;
  }
}

/**
 * Codificar assunto do email usando RFC 2047 (para suportar emojis e caracteres especiais)
 * @param {string} subject - Assunto do email
 * @returns {string} - Assunto codificado
 */
function encodeSubject(subject) {
  // Verificar se contém caracteres não-ASCII (incluindo emojis)
  const hasNonAscii = /[^\x00-\x7F]/.test(subject);
  
  if (!hasNonAscii) {
    // Se só tem ASCII, retornar como está
    return subject;
  }
  
  // Codificar usando Base64 (RFC 2047)
  const encoded = Buffer.from(subject, 'utf8').toString('base64');
  return `=?UTF-8?B?${encoded}?=`;
}

/**
 * Criar mensagem MIME para envio
 */
function createMessage(to, subject, htmlBody, textBody, fromEmail, fromName) {
  // Codificar assunto para suportar emojis e caracteres especiais
  const encodedSubject = encodeSubject(subject);
  
  const message = [
    `From: ${fromName} <${fromEmail}>`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
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
 * Enviar email com tratamento de erros de autenticação
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
    // Resetar cliente Gmail para forçar reinicialização se houver erro de auth
    let gmailClient = initGmail();
    
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
    // Tratar erro de autenticação (invalid_grant)
    if (error.code === 400 && error.message && error.message.includes('invalid_grant')) {
      console.error('❌ Erro de autenticação (invalid_grant): Token expirado ou revogado');
      console.error('   Solução: Execute a autorização novamente usando: npm run gmail:auth');
      
      // Resetar cliente Gmail para forçar nova inicialização na próxima tentativa
      gmail = null;
      
      throw new Error('Token OAuth expirado ou revogado. É necessário reautorizar o serviço Gmail. Execute: npm run gmail:auth');
    }
    
    // Tratar outros erros de autenticação
    if (error.code === 401 || (error.response && error.response.status === 401)) {
      console.error('❌ Erro de autenticação (401): Token inválido');
      console.error('   Solução: Execute a autorização novamente usando: npm run gmail:auth');
      
      // Resetar cliente Gmail
      gmail = null;
      
      throw new Error('Token OAuth inválido. É necessário reautorizar o serviço Gmail. Execute: npm run gmail:auth');
    }
    
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

