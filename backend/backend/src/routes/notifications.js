import express from 'express';
import Joi from 'joi';
import databaseService from '../services/database.js';
import { 
  asyncHandler, 
  validateRequest, 
  ValidationError, 
  NotFoundError,
  AuthorizationError 
} from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const db = databaseService;

// Validation schemas
const createNotificationSchema = Joi.object({
  body: Joi.object({
    title: Joi.string().min(1).max(100).required(),
    message: Joi.string().min(1).max(500).required(),
    type: Joi.string().valid('info', 'warning', 'success', 'error').required(),
    priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
    recipients: Joi.array().items(Joi.string().uuid()).required(),
    link: Joi.string().uri().optional(),
    expiresAt: Joi.date().iso().optional()
  })
});

const updateNotificationSchema = Joi.object({
  body: Joi.object({
    isRead: Joi.boolean().optional(),
    isArchived: Joi.boolean().optional()
  })
});

// Helper functions
const formatNotification = (notification) => {
  return {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    priority: notification.priority,
    userId: notification.user_id,
    isRead: notification.is_read,
    isArchived: notification.is_archived,
    link: notification.link,
    expiresAt: notification.expires_at,
    createdAt: notification.created_at,
    updatedAt: notification.updated_at
  };
};

// Routes
// @route   POST /api/v1/notifications
// @desc    Create a new notification
// @access  Private (Admin only)
router.post('/', authenticateToken, validateRequest(createNotificationSchema), asyncHandler(async (req, res) => {
  const { title, message, type, priority, recipients, link, expiresAt } = req.body;

  try {
    // Only admins can create notifications
    if (req.user.role !== 'admin') {
      throw new AuthorizationError('Access denied to create notifications');
    }

    // Create notifications for each recipient
    const notifications = [];
    for (const recipientId of recipients) {
      const notification = await db.create('notifications', {
        title,
        message,
        type,
        priority,
        user_id: recipientId,
        is_read: false,
        is_archived: false,
        link,
        expires_at: expiresAt ? new Date(expiresAt) : null,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      notifications.push(notification);
    }

    res.status(201).json({
      success: true,
      message: 'Notifications created successfully',
      data: {
        notifications: notifications.map(formatNotification)
      }
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create notifications',
      details: error.message
    });
  }
}));

// @route   GET /api/v1/notifications
// @desc    Get user's notifications
// @access  Private
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const { limit = 20, offset = 0, unreadOnly = false, archived = false } = req.query;
  const userId = req.user.id;

  try {
    // Build query conditions
    let conditions = 'WHERE n.user_id = $1';
    const params = [userId];
    let paramIndex = 1;

    if (unreadOnly === 'true') {
      conditions += ` AND n.is_read = false`;
    }

    if (archived === 'true') {
      conditions += ` AND n.is_archived = true`;
    } else {
      conditions += ` AND n.is_archived = false`;
    }

    // Get notifications
    const notifications = await db.query(`
      SELECT 
        n.id,
        n.title,
        n.message,
        n.type,
        n.priority,
        n.user_id,
        n.is_read,
        n.is_archived,
        n.link,
        n.expires_at,
        n.created_at,
        n.updated_at
      FROM notifications n
      ${conditions}
      ORDER BY n.created_at DESC
      LIMIT $${++paramIndex} OFFSET $${++paramIndex}
    `, [...params, parseInt(limit), parseInt(offset)]);

    // Get total count
    const countResult = await db.query(`
      SELECT COUNT(*) as count
      FROM notifications n
      ${conditions}
    `, params);

    const totalCount = parseInt(countResult.rows ? countResult.rows[0].count : countResult[0].count);

    res.json({
      success: true,
      data: {
        notifications: (notifications.rows || notifications).map(formatNotification),
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications',
      details: error.message
    });
  }
}));

// @route   GET /api/v1/notifications/:notificationId
// @desc    Get a specific notification
// @access  Private
router.get('/:notificationId', authenticateToken, asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user.id;

  try {
    // Find notification
    const notification = await db.findById('notifications', notificationId);
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    // Check ownership
    if (notification.user_id !== userId) {
      throw new AuthorizationError('Access denied to this notification');
    }

    res.json({
      success: true,
      data: {
        notification: formatNotification(notification)
      }
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AuthorizationError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    console.error('Get notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification',
      details: error.message
    });
  }
}));

// @route   PUT /api/v1/notifications/:notificationId
// @desc    Update a notification
// @access  Private
router.put('/:notificationId', authenticateToken, validateRequest(updateNotificationSchema), asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const { isRead, isArchived } = req.body;
  const userId = req.user.id;

  try {
    // Find notification
    const notification = await db.findById('notifications', notificationId);
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    // Check ownership
    if (notification.user_id !== userId) {
      throw new AuthorizationError('Access denied to update this notification');
    }

    // Prepare update data
    const updateData = {};
    if (isRead !== undefined) updateData.is_read = isRead;
    if (isArchived !== undefined) updateData.is_archived = isArchived;
    updateData.updated_at = new Date();

    // Update notification
    const updatedNotification = await db.update('notifications', notificationId, updateData);

    res.json({
      success: true,
      message: 'Notification updated successfully',
      data: {
        notification: formatNotification(updatedNotification)
      }
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AuthorizationError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    console.error('Update notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification',
      details: error.message
    });
  }
}));

// @route   DELETE /api/v1/notifications/:notificationId
// @desc    Delete a notification
// @access  Private
router.delete('/:notificationId', authenticateToken, asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user.id;

  try {
    // Find notification
    const notification = await db.findById('notifications', notificationId);
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    // Check ownership
    if (notification.user_id !== userId && req.user.role !== 'admin') {
      throw new AuthorizationError('Access denied to delete this notification');
    }

    // Delete notification
    await db.delete('notifications', notificationId);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AuthorizationError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification',
      details: error.message
    });
  }
}));

// @route   PUT /api/v1/notifications/mark-all-read
// @desc    Mark all notifications as read
// @access  Private
router.put('/mark-all-read', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.id;

  try {
    // Update all unread notifications
    await db.query(`
      UPDATE notifications 
      SET is_read = true, updated_at = $1
      WHERE user_id = $2 AND is_read = false
    `, [new Date(), userId]);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notifications as read',
      details: error.message
    });
  }
}));

// @route   DELETE /api/v1/notifications/clear-all
// @desc    Clear all read notifications
// @access  Private
router.delete('/clear-all', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.id;

  try {
    // Delete all read notifications
    await db.query(`
      DELETE FROM notifications 
      WHERE user_id = $1 AND is_read = true AND is_archived = false
    `, [userId]);

    res.json({
      success: true,
      message: 'All read notifications cleared'
    });
  } catch (error) {
    console.error('Clear all error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear notifications',
      details: error.message
    });
  }
}));

export default router;
