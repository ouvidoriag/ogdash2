/**
 * Rotas de Autenticação
 */

import express from 'express';
import { login, logout, getCurrentUser } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

export default function authRoutes(prisma) {
  const router = express.Router();

  // Injetar prisma no request para os controllers
  router.use((req, res, next) => {
    req.prisma = prisma;
    next();
  });

  // POST /api/auth/login
  router.post('/login', login);

  // POST /api/auth/logout
  router.post('/logout', requireAuth, logout);

  // GET /api/auth/me - Informações do usuário autenticado
  router.get('/me', requireAuth, getCurrentUser);

  return router;
}

