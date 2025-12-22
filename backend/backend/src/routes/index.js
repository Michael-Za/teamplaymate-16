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

router.get('/health', (req, res) => {
  res.json({ status: 'OK', uptime: process.uptime() });
});

// REMOVE '/api/v1' from here. 
// Just mount the specific feature names.
router.use('/auth', authRoutes); // NOW: mounts on /auth
router.use('/teams', authenticateToken, teamsRoutes); // NOW: mounts on /teams
router.use('/players', authenticateToken, playersRoutes);
router.use('/matches', authenticateToken, matchesRoutes);
router.use('/analytics', authenticateToken, analyticsRoutes);
router.use('/chat', authenticateToken, chatRoutes);
router.use('/events', authenticateToken, eventsRoutes);
router.use('/ai-assistant', aiAssistantRoutes);
router.use('/aichat', authenticateToken, aiChatRoutes);
router.use('/notifications', authenticateToken, notificationsRoutes);

export default router;