/**
 * Controller de Autenticação
 * Gerencia login, logout e verificação de sessão
 */

import bcrypt from 'bcrypt';

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

    const { prisma } = req;
    
    // Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuário ou senha inválidos' 
      });
    }

    // Verificar senha
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuário ou senha inválidos' 
      });
    }

    // Criar sessão
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.isAuthenticated = true;

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
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
        console.error('Erro ao destruir sessão:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Erro ao fazer logout' 
        });
      }
      
      res.clearCookie('connect.sid');
      res.json({ 
        success: true, 
        message: 'Logout realizado com sucesso' 
      });
    });
  } catch (error) {
    console.error('Erro no logout:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
}

/**
 * GET /api/auth/me
 * Retorna informações do usuário autenticado
 */
export async function getCurrentUser(req, res) {
  try {
    if (!req.session.isAuthenticated) {
      return res.status(401).json({ 
        success: false, 
        message: 'Não autenticado' 
      });
    }

    const { prisma } = req;
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: {
        id: true,
        username: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuário não encontrado' 
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
}

