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
  requireTeamOwnership 
} from '../middleware/auth.js';

const router = express.Router();
const db = databaseService;
const redis = redisService;

// Validation schemas
const createEventSchema = Joi.object({
  body: Joi.object({
    title: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(1000).optional(),
    eventType: Joi.string().valid('match', 'training', 'meeting', 'other').required(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
    location: Joi.string().max(200).optional(),
    teamId: Joi.string().uuid().required(),
    isAllDay: Joi.boolean().optional().default(false),
    reminders: Joi.array().items(Joi.object({
      type: Joi.string().valid('email', 'notification').required(),
      minutesBefore: Joi.number().integer().min(0).max(1440).required()
    })).optional(),
    attendees: Joi.array().items(Joi.string().uuid()).optional()
  })
});

const updateEventSchema = Joi.object({
  body: Joi.object({
    title: Joi.string().min(3).max(100).optional(),
    description: Joi.string().max(1000).optional(),
    eventType: Joi.string().valid('match', 'training', 'meeting', 'other').optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    location: Joi.string().max(200).optional(),
    isAllDay: Joi.boolean().optional(),
    reminders: Joi.array().items(Joi.object({
      type: Joi.string().valid('email', 'notification').required(),
      minutesBefore: Joi.number().integer().min(0).max(1440).required()
    })).optional(),
    attendees: Joi.array().items(Joi.string().uuid()).optional()
  })
});

const getEventsSchema = Joi.object({
  query: Joi.object({
    teamId: Joi.string().uuid().required(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    eventType: Joi.string().valid('match', 'training', 'meeting', 'other').optional()
  })
});

// Helper functions
const formatEvent = (event) => {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    eventType: event.event_type,
    startDate: event.start_date,
    endDate: event.end_date,
    location: event.location,
    teamId: event.team_id,
    isAllDay: event.is_all_day,
    createdBy: event.created_by,
    createdAt: event.created_at,
    updatedAt: event.updated_at
  };
};

// Routes
// @route   POST /api/v1/events
// @desc    Create a new event
// @access  Private (Team owners/coaches only)
router.post('/', authenticateToken, requireRole(['coach', 'manager']), validateRequest(createEventSchema), asyncHandler(async (req, res) => {
  const { 
    title, 
    description, 
    eventType, 
    startDate, 
    endDate, 
    location, 
    teamId, 
    isAllDay, 
    reminders, 
    attendees 
  } = req.body;
  
  const userId = req.user.id;

  try {
    // Verify team ownership
    const team = await db.findById('teams', teamId);
    if (!team) {
      throw new NotFoundError('Team not found');
    }

    if (team.owner_id !== userId && req.user.role !== 'manager') {
      throw new AuthorizationError('Access denied to create events for this team');
    }

    // Create event
    const event = await db.create('events', {
      title,
      description,
      event_type: eventType,
      start_date: new Date(startDate),
      end_date: new Date(endDate),
      location,
      team_id: teamId,
      is_all_day: isAllDay,
      created_by: userId,
      created_at: new Date(),
      updated_at: new Date()
    });

    // Handle attendees
    if (attendees && attendees.length > 0) {
      for (const attendeeId of attendees) {
        await db.create('event_attendees', {
          event_id: event.id,
          user_id: attendeeId,
          status: 'invited',
          created_at: new Date()
        });
      }
    }

    // Handle reminders
    if (reminders && reminders.length > 0) {
      for (const reminder of reminders) {
        await db.create('event_reminders', {
          event_id: event.id,
          type: reminder.type,
          minutes_before: reminder.minutesBefore,
          created_at: new Date()
        });
      }
    }

    // Format response
    const formattedEvent = formatEvent(event);

    // Publish to Redis for real-time updates
    await redis.publish(`events:${teamId}`, JSON.stringify({
      type: 'NEW_EVENT',
      data: formattedEvent
    }));

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: formattedEvent
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AuthorizationError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create event',
      details: error.message
    });
  }
}));

// @route   GET /api/v1/events
// @desc    Get events for a team
// @access  Private (Team members only)
router.get('/', authenticateToken, validateRequest(getEventsSchema), asyncHandler(async (req, res) => {
  const { teamId, startDate, endDate, eventType } = req.query;
  const userId = req.user.id;

  try {
    // Verify team membership
    const team = await db.findById('teams', teamId);
    if (!team) {
      throw new NotFoundError('Team not found');
    }

    // Check if user is team member
    const isTeamMember = await db.findOne('team_memberships', {
      team_id: teamId,
      user_id: userId
    });

    if (!isTeamMember && req.user.role !== 'admin') {
      throw new AuthorizationError('Access denied to view events for this team');
    }

    // Build query conditions
    let conditions = 'WHERE e.team_id = $1';
    const params = [teamId];
    let paramIndex = 1;

    if (startDate) {
      conditions += ` AND e.start_date >= $${++paramIndex}`;
      params.push(new Date(startDate));
    }

    if (endDate) {
      conditions += ` AND e.end_date <= $${++paramIndex}`;
      params.push(new Date(endDate));
    }

    if (eventType) {
      conditions += ` AND e.event_type = $${++paramIndex}`;
      params.push(eventType);
    }

    // Get events
    const events = await db.query(`
      SELECT 
        e.id,
        e.title,
        e.description,
        e.event_type,
        e.start_date,
        e.end_date,
        e.location,
        e.team_id,
        e.is_all_day,
        e.created_by,
        e.created_at,
        e.updated_at
      FROM events e
      ${conditions}
      ORDER BY e.start_date ASC
    `, params);

    // Format events
    const formattedEvents = (events.rows || events).map(formatEvent);

    res.json({
      success: true,
      data: {
        events: formattedEvents
      }
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AuthorizationError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events',
      details: error.message
    });
  }
}));

// @route   GET /api/v1/events/:eventId
// @desc    Get a specific event
// @access  Private (Team members only)
router.get('/:eventId', authenticateToken, asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user.id;

  try {
    // Find event
    const event = await db.findById('events', eventId);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Verify team membership
    const team = await db.findById('teams', event.team_id);
    if (!team) {
      throw new NotFoundError('Team not found');
    }

    // Check if user is team member
    const isTeamMember = await db.findOne('team_memberships', {
      team_id: event.team_id,
      user_id: userId
    });

    if (!isTeamMember && req.user.role !== 'admin') {
      throw new AuthorizationError('Access denied to view this event');
    }

    // Get attendees
    const attendees = await db.query(`
      SELECT 
        ea.user_id,
        u.first_name,
        u.last_name,
        u.email,
        ea.status,
        ea.created_at
      FROM event_attendees ea
      JOIN users u ON ea.user_id = u.id
      WHERE ea.event_id = $1
    `, [eventId]);

    // Get reminders
    const reminders = await db.query(`
      SELECT 
        er.type,
        er.minutes_before,
        er.created_at
      FROM event_reminders er
      WHERE er.event_id = $1
    `, [eventId]);

    // Format response
    const formattedEvent = formatEvent(event);

    res.json({
      success: true,
      data: {
        event: {
          ...formattedEvent,
          attendees: attendees.rows || attendees,
          reminders: reminders.rows || reminders
        }
      }
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AuthorizationError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch event',
      details: error.message
    });
  }
}));

// @route   PUT /api/v1/events/:eventId
// @desc    Update an event
// @access  Private (Event creator or team owner)
router.put('/:eventId', authenticateToken, validateRequest(updateEventSchema), asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { 
    title, 
    description, 
    eventType, 
    startDate, 
    endDate, 
    location, 
    isAllDay, 
    reminders, 
    attendees 
  } = req.body;
  
  const userId = req.user.id;

  try {
    // Find event
    const event = await db.findById('events', eventId);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Check permissions (event creator, team owner, or manager)
    const team = await db.findById('teams', event.team_id);
    if (!team) {
      throw new NotFoundError('Team not found');
    }

    if (
      event.created_by !== userId && 
      team.owner_id !== userId && 
      req.user.role !== 'manager' && 
      req.user.role !== 'admin'
    ) {
      throw new AuthorizationError('Access denied to update this event');
    }

    // Prepare update data
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (eventType !== undefined) updateData.event_type = eventType;
    if (startDate !== undefined) updateData.start_date = new Date(startDate);
    if (endDate !== undefined) updateData.end_date = new Date(endDate);
    if (location !== undefined) updateData.location = location;
    if (isAllDay !== undefined) updateData.is_all_day = isAllDay;
    updateData.updated_at = new Date();

    // Update event
    const updatedEvent = await db.update('events', eventId, updateData);

    // Handle attendees (if provided)
    if (attendees !== undefined) {
      // Delete existing attendees
      await db.query('DELETE FROM event_attendees WHERE event_id = $1', [eventId]);
      
      // Add new attendees
      if (attendees.length > 0) {
        for (const attendeeId of attendees) {
          await db.create('event_attendees', {
            event_id: eventId,
            user_id: attendeeId,
            status: 'invited',
            created_at: new Date()
          });
        }
      }
    }

    // Handle reminders (if provided)
    if (reminders !== undefined) {
      // Delete existing reminders
      await db.query('DELETE FROM event_reminders WHERE event_id = $1', [eventId]);
      
      // Add new reminders
      if (reminders.length > 0) {
        for (const reminder of reminders) {
          await db.create('event_reminders', {
            event_id: eventId,
            type: reminder.type,
            minutes_before: reminder.minutesBefore,
            created_at: new Date()
          });
        }
      }
    }

    // Format response
    const formattedEvent = formatEvent(updatedEvent);

    // Publish to Redis for real-time updates
    await redis.publish(`events:${event.team_id}`, JSON.stringify({
      type: 'UPDATE_EVENT',
      data: formattedEvent
    }));

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: formattedEvent
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AuthorizationError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update event',
      details: error.message
    });
  }
}));

// @route   DELETE /api/v1/events/:eventId
// @desc    Delete an event
// @access  Private (Event creator or team owner)
router.delete('/:eventId', authenticateToken, asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user.id;

  try {
    // Find event
    const event = await db.findById('events', eventId);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Check permissions (event creator, team owner, or manager)
    const team = await db.findById('teams', event.team_id);
    if (!team) {
      throw new NotFoundError('Team not found');
    }

    if (
      event.created_by !== userId && 
      team.owner_id !== userId && 
      req.user.role !== 'manager' && 
      req.user.role !== 'admin'
    ) {
      throw new AuthorizationError('Access denied to delete this event');
    }

    // Delete related data
    await db.query('DELETE FROM event_attendees WHERE event_id = $1', [eventId]);
    await db.query('DELETE FROM event_reminders WHERE event_id = $1', [eventId]);

    // Delete event
    await db.delete('events', eventId);

    // Publish to Redis for real-time updates
    await redis.publish(`events:${event.team_id}`, JSON.stringify({
      type: 'DELETE_EVENT',
      data: { id: eventId }
    }));

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AuthorizationError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete event',
      details: error.message
    });
  }
}));

// @route   POST /api/v1/events/:eventId/rsvp
// @desc    RSVP to an event
// @access  Private (Event attendees only)
router.post('/:eventId/rsvp', authenticateToken, asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { status } = req.body; // 'accepted', 'declined', 'maybe'
  const userId = req.user.id;

  try {
    // Find event
    const event = await db.findById('events', eventId);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Check if user is invited to the event
    const attendee = await db.findOne('event_attendees', {
      event_id: eventId,
      user_id: userId
    });

    if (!attendee) {
      throw new AuthorizationError('You are not invited to this event');
    }

    // Update RSVP status
    const updatedAttendee = await db.update('event_attendees', attendee.id, {
      status,
      updated_at: new Date()
    });

    // Format response
    const formattedAttendee = {
      userId: updatedAttendee.user_id,
      status: updatedAttendee.status,
      updatedAt: updatedAttendee.updated_at
    };

    // Publish to Redis for real-time updates
    await redis.publish(`events:${event.team_id}`, JSON.stringify({
      type: 'RSVP_UPDATE',
      data: {
        eventId,
        attendee: formattedAttendee
      }
    }));

    res.json({
      success: true,
      message: `RSVP status updated to ${status}`,
      data: formattedAttendee
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AuthorizationError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    console.error('RSVP error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update RSVP',
      details: error.message
    });
  }
}));

export default router;