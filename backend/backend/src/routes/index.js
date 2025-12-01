import express from 'express';
import authRoutes from './auth.js';
import teamsRoutes from './teams.js';
import playersRoutes from './players.js';
import matchesRoutes from './matches.js';
import analyticsRoutes from './analytics.js';
import chatRoutes from './chat.js';
import eventsRoutes from './events.js';
import aiAssistantRoutes from './aiAssistant.js';
import aiChatRoutes from './aiChat.js';
import notificationsRoutes from './notifications.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
router.use('/api/v1/auth', authRoutes);
router.use('/api/v1/teams', authenticateToken, teamsRoutes);
router.use('/api/v1/players', authenticateToken, playersRoutes);
router.use('/api/v1/matches', authenticateToken, matchesRoutes);
router.use('/api/v1/analytics', authenticateToken, analyticsRoutes);
router.use('/api/v1/chat', authenticateToken, chatRoutes);
router.use('/api/v1/events', authenticateToken, eventsRoutes);
router.use('/api/v1/ai-assistant', aiAssistantRoutes);
router.use('/api/v1/aichat', authenticateToken, aiChatRoutes);
router.use('/api/v1/notifications', authenticateToken, notificationsRoutes);

export default router;