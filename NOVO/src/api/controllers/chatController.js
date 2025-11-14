/**
 * Controllers de Chat
 * /api/chat/*
 */

import { safeQuery } from '../../utils/responseHelper.js';

/**
 * GET /api/chat/messages
 * Listar mensagens do chat
 */
export async function getMessages(req, res, prisma) {
  return safeQuery(res, async () => {
    const limit = Number(req.query.limit ?? 50);
    const messages = await prisma.chatMessage.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' }
    });
    
    return messages.map(m => ({
      id: m.id,
      text: m.text,
      sender: m.sender,
      createdAt: m.createdAt.toISOString()
    })).reverse(); // Reverter para ordem cronológica
  });
}

/**
 * POST /api/chat/messages
 * Criar nova mensagem e obter resposta da IA
 */
export async function createMessage(req, res, prisma) {
  return safeQuery(res, async () => {
    const { text } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'text required' });
    }
    
    // Salvar mensagem do usuário
    const message = await prisma.chatMessage.create({
      data: {
        text: text.trim(),
        sender: 'user'
      }
    });
    
    // TODO: Implementar integração com Gemini AI
    // Por enquanto, retornar resposta simples
    const response = 'Resposta da IA será implementada aqui';
    
    // Salvar resposta da IA
    await prisma.chatMessage.create({
      data: {
        text: response,
        sender: 'cora'
      }
    });
    
    return {
      message: {
        id: message.id,
        text: message.text,
        sender: message.sender,
        createdAt: message.createdAt.toISOString()
      },
      response: response
    };
  });
}

