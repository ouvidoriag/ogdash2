/**
 * Rotas de chat
 * Endpoints para sistema de mensagens e chat
 * 
 * Endpoints:
 * - GET /api/chat/messages - Listar mensagens do chat
 * - POST /api/chat/messages - Criar nova mensagem
 * 
 * @param {PrismaClient} prisma - Cliente Prisma
 * @returns {express.Router} Router configurado
 */

import express from 'express';
import * as chatController from '../controllers/chatController.js';

export default function chatRoutes(prisma) {
  const router = express.Router();
  
  /**
   * GET /api/chat/messages
   * Listar todas as mensagens do chat
   * Query params: limit (opcional, padrão: 500)
   */
  router.get('/messages', (req, res) => chatController.getMessages(req, res, prisma));
  
  /**
   * POST /api/chat/messages
   * Criar nova mensagem no chat
   * Body: { text: string, sender: 'user' | 'assistant' }
   */
  router.post('/messages', (req, res) => chatController.createMessage(req, res, prisma));
  
  return router;
}

