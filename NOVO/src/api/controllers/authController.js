/**
 * Controller de Autenticação
 * Gerencia login, logout e verificação de sessão
 * 
 * REFATORAÇÃO: Prisma → Mongoose
 * Data: 03/12/2025
 * CÉREBRO X-3
 */

import bcrypt from 'bcrypt';
import User from '../../models/User.model.js';
import logger from '../../utils/logger.js';

/**
 * POST /api/auth/login
 * Autentica um usuário
 */
export async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Usuário e senha são obrigatórios' 
      });
    }
    
    // Buscar usuário no banco
    const user = await User.findByUsername(username.toLowerCase());

    if (!user) {
      logger.warn(`Tentativa de login com usuário inexistente: ${username.toLowerCase()}`);
      return res.status(401).json({ 
        success: false, 
        message: 'Usuário ou senha inválidos' 
      });
    }

    // Verificar senha
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      logger.warn(`Senha incorreta para usuário: ${username.toLowerCase()}`);
      return res.status(401).json({ 
        success: false, 
        message: 'Usuário ou senha inválidos' 
      });
    }

    // Criar sessão
    req.session.userId = user._id.toString();
    req.session.username = user.username;
    req.session.isAuthenticated = true;

    // IMPORTANTE: Salvar sessão explicitamente antes de enviar resposta
    // Isso garante que a sessão seja persistida antes do redirect
    req.session.save((err) => {
      if (err) {
        logger.error('Erro ao salvar sessão:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Erro ao criar sessão' 
        });
      }

      logger.info(`Login realizado com sucesso: ${user.username} (sessão: ${req.sessionID})`);

      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        user: {
          id: user._id.toString(),
          username: user.username
        }
      });
    });
  } catch (error) {
    logger.error('Erro no login:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
}

/**
 * POST /api/auth/logout
 * Encerra a sessão do usuário
 */
export async function logout(req, res) {
  try {
    req.session.destroy((err) => {
      if (err) {
        logger.error('Erro ao destruir sessão:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Erro ao fazer logout' 
        });
      }
      
      res.clearCookie('ouvidoria.sid');
      res.json({ 
        success: true, 
        message: 'Logout realizado com sucesso' 
      });
    });
  } catch (error) {
    logger.error('Erro no logout:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
}

/**
 * GET /api/auth/me
 * Retorna informações do usuário autenticado
 * Não requer autenticação - apenas verifica se está autenticado
 */
export async function getCurrentUser(req, res) {
  try {
    // Verificar se está autenticado (sem usar requireAuth para evitar loops)
    if (!req.session || !req.session.isAuthenticated) {
      return res.status(401).json({ 
        success: false, 
        message: 'Não autenticado' 
      });
    }

    const user = await User.findById(req.session.userId)
      .select('_id username createdAt')
      .lean();

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuário não encontrado' 
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        username: user.username,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    logger.error('Erro ao buscar usuário:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
}

