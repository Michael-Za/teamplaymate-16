import express from 'express';
import Joi from 'joi';
import databaseService from '../services/database.js';
import redisService from '../services/redis.js';
import { 
  asyncHandler, 
  validateRequest, 
  ValidationError, 
  NotFoundError,
  AuthorizationError 
} from '../middleware/errorHandler.js';
import { 
  authenticateToken, 
  requireRole, 
  requireTeamMembership 
} from '../middleware/auth.js';

const router = express.Router();
const db = databaseService;
const redis = redisService;

// Validation schemas
const sendMessageSchema = Joi.object({
  body: Joi.object({
    content: Joi.string().min(1).max(1000).required(),
    teamId: Joi.string().uuid().required(),
    parentId: Joi.string().uuid().optional()
  })
});

const getMessagesSchema = Joi.object({
  query: Joi.object({
    teamId: Joi.string().uuid().required(),
    limit: Joi.number().integer().min(1).max(100).default(50),
    before: Joi.string().isoDate().optional(),
    after: Joi.string().isoDate().optional()
  })
});

// Helper functions
const sanitizeMessage = (message) => {
  // Remove any HTML tags and escape special characters
  return message.replace(/<[^>]*>/g, '').trim();
};

const formatMessage = (message) => {
  return {
    id: message.id,
    content: message.content,
    teamId: message.team_id,
    userId: message.user_id,
    parentId: message.parent_id,
    createdAt: message.created_at,
    updatedAt: message.updated_at,
    user: {
      id: message.user_id,
      firstName: message.first_name,
      lastName: message.last_name,
      role: message.role
    }
  };
};

// Routes
// @route   POST /api/v1/chat/messages
// @desc    Send a chat message
// @access  Private (Team members only)
router.post('/messages', authenticateToken, requireTeamMembership, validateRequest(sendMessageSchema), asyncHandler(async (req, res) => {
  const { content, teamId, parentId } = req.body;
  const userId = req.user.id;

  try {
    // Sanitize message content
    const sanitizedContent = sanitizeMessage(content);

    // Validate parent message if provided
    if (parentId) {
      const parentMessage = await db.findById('chat_messages', parentId);
      if (!parentMessage || parentMessage.team_id !== teamId) {
        throw new ValidationError('Invalid parent message');
      }
    }

    // Create message
    const message = await db.create('chat_messages', {
      content: sanitizedContent,
      team_id: teamId,
      user_id: userId,
      parent_id: parentId,
      created_at: new Date(),
      updated_at: new Date()
    });

    // Get user details for the response
    const user = await db.findById('users', userId);

    // Format response
    const formattedMessage = formatMessage({
      ...message,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role
    });

    // Publish to Redis for real-time updates
    await redis.publish(`chat:${teamId}`, JSON.stringify({
      type: 'NEW_MESSAGE',
      data: formattedMessage
    }));

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: formattedMessage
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message',
      details: error.message
    });
  }
}));

// @route   GET /api/v1/chat/messages
// @desc    Get chat messages for a team
// @access  Private (Team members only)
router.get('/messages', authenticateToken, requireTeamMembership, validateRequest(getMessagesSchema), asyncHandler(async (req, res) => {
  const { teamId, limit, before, after } = req.query;

  try {
    // Build query conditions
    let conditions = 'WHERE cm.team_id = $1';
    const params = [teamId];
    let paramIndex = 1;

    if (before) {
      conditions += ` AND cm.created_at < $${++paramIndex}`;
      params.push(new Date(before));
    }

    if (after) {
      conditions += ` AND cm.created_at > $${++paramIndex}`;
      params.push(new Date(after));
    }

    // Get messages with user details
    const messages = await db.query(`
      SELECT 
        cm.id,
        cm.content,
        cm.team_id,
        cm.user_id,
        cm.parent_id,
        cm.created_at,
        cm.updated_at,
        u.first_name,
        u.last_name,
        u.role
      FROM chat_messages cm
      JOIN users u ON cm.user_id = u.id
      ${conditions}
      ORDER BY cm.created_at DESC
      LIMIT $${++paramIndex}
    `, [...params, limit]);

    // Format messages
    const formattedMessages = (messages.rows || messages).map(formatMessage);

    res.json({
      success: true,
      data: {
        messages: formattedMessages
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages',
      details: error.message
    });
  }
}));

// @route   PUT /api/v1/chat/messages/:messageId
// @desc    Edit a chat message
// @access  Private (Message owner or admin)
router.put('/messages/:messageId', authenticateToken, asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  try {
    // Find message
    const message = await db.findById('chat_messages', messageId);
    if (!message) {
      throw new NotFoundError('Message not found');
    }

    // Check permissions (message owner or admin)
    if (message.user_id !== userId && req.user.role !== 'admin') {
      throw new AuthorizationError('Access denied to edit this message');
    }

    // Sanitize message content
    const sanitizedContent = sanitizeMessage(content);

    // Update message
    const updatedMessage = await db.update('chat_messages', messageId, {
      content: sanitizedContent,
      updated_at: new Date()
    });

    // Get user details for the response
    const user = await db.findById('users', userId);

    // Format response
    const formattedMessage = formatMessage({
      ...updatedMessage,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role
    });

    // Publish to Redis for real-time updates
    await redis.publish(`chat:${message.team_id}`, JSON.stringify({
      type: 'EDIT_MESSAGE',
      data: formattedMessage
    }));

    res.json({
      success: true,
      message: 'Message updated successfully',
      data: formattedMessage
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AuthorizationError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    console.error('Edit message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update message',
      details: error.message
    });
  }
}));

// @route   DELETE /api/v1/chat/messages/:messageId
// @desc    Delete a chat message
// @access  Private (Message owner, team admin, or system admin)
router.delete('/messages/:messageId', authenticateToken, asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.id;

  try {
    // Find message
    const message = await db.findById('chat_messages', messageId);
    if (!message) {
      throw new NotFoundError('Message not found');
    }

    // Check permissions (message owner, team admin, or system admin)
    const userTeam = await db.findById('teams', message.team_id);
    if (
      message.user_id !== userId && 
      req.user.role !== 'admin' && 
      (!userTeam || userTeam.owner_id !== userId)
    ) {
      throw new AuthorizationError('Access denied to delete this message');
    }

    // Delete message
    await db.delete('chat_messages', messageId);

    // Publish to Redis for real-time updates
    await redis.publish(`chat:${message.team_id}`, JSON.stringify({
      type: 'DELETE_MESSAGE',
      data: { id: messageId }
    }));

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AuthorizationError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete message',
      details: error.message
    });
  }
}));

// @route   GET /api/v1/chat/teams/:teamId/stats
// @desc    Get chat statistics for a team
// @access  Private (Team members only)
router.get('/teams/:teamId/stats', authenticateToken, requireTeamMembership, asyncHandler(async (req, res) => {
  const { teamId } = req.params;

  try {
    // Get total message count
    const totalMessages = await db.query(`
      SELECT COUNT(*) as count
      FROM chat_messages
      WHERE team_id = $1
    `, [teamId]);

    // Get active users (users who sent messages in the last 30 days)
    const activeUsers = await db.query(`
      SELECT DISTINCT u.id, u.first_name, u.last_name, u.role
      FROM chat_messages cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.team_id = $1
        AND cm.created_at >= CURRENT_DATE - INTERVAL '30 days'
    `, [teamId]);

    // Get message count by user
    const messagesByUser = await db.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.role,
        COUNT(cm.id) as message_count
      FROM chat_messages cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.team_id = $1
      GROUP BY u.id, u.first_name, u.last_name, u.role
      ORDER BY message_count DESC
      LIMIT 10
    `, [teamId]);

    res.json({
      success: true,
      data: {
        totalMessages: parseInt(totalMessages.rows ? totalMessages.rows[0].count : totalMessages[0].count),
        activeUsers: activeUsers.rows || activeUsers,
        topContributors: messagesByUser.rows || messagesByUser
      }
    });
  } catch (error) {
    console.error('Chat stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chat statistics',
      details: error.message
    });
  }
}));

export default router;
