/**
 * Rotas de Notificações por Email
 * @param {PrismaClient} prisma - Cliente Prisma para acesso ao banco
 */

import express from 'express';
import {
  getAuthUrlEndpoint,
  authCallback,
  getAuthStatus,
  executeNotifications,
  getNotificationHistory,
  getNotificationStats,
  getEmailConfig,
  getSchedulerStatus,
  executeSchedulerManual,
  testEmail
} from '../controllers/notificationController.js';

export default function notificationRoutes(prisma) {
  const router = express.Router();

/**
 * Rotas de autenticação
 */
router.get('/auth/url', getAuthUrlEndpoint);
router.post('/auth/callback', authCallback);
router.get('/auth/status', getAuthStatus);

/**
 * Rotas de execução
 */
router.post('/execute', (req, res) => executeNotifications(req, res, prisma));
router.post('/scheduler/execute', (req, res) => executeSchedulerManual(req, res, prisma));

/**
 * Rotas de consulta
 */
router.get('/history', (req, res) => getNotificationHistory(req, res, prisma));
router.get('/stats', (req, res) => getNotificationStats(req, res, prisma));
router.get('/config', getEmailConfig);
router.get('/scheduler/status', getSchedulerStatus);

/**
 * Rota de teste
 */
router.get('/test', testEmail);

return router;
}

