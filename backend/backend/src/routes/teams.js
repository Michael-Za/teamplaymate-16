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
const createTeamSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(500).optional(),
    sport: Joi.string().max(50).required(),
    founded: Joi.date().iso().optional(),
    location: Joi.string().max(100).optional(),
    website: Joi.string().uri().optional(),
    contactEmail: Joi.string().email().optional()
  })
});

const updateTeamSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    description: Joi.string().max(500).optional(),
    sport: Joi.string().max(50).optional(),
    founded: Joi.date().iso().optional(),
    location: Joi.string().max(100).optional(),
    website: Joi.string().uri().optional(),
    contactEmail: Joi.string().email().optional()
  })
});

const inviteMemberSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required(),
    role: Joi.string().valid('player', 'coach', 'assistant').required()
  })
});

// Helper functions
const formatTeam = (team) => {
  return {
    id: team.id,
    name: team.name,
    description: team.description,
    sport: team.sport,
    founded: team.founded,
    location: team.location,
    website: team.website,
    contactEmail: team.contact_email,
    ownerId: team.owner_id,
    createdAt: team.created_at,
    updatedAt: team.updated_at
  };
};

// Routes
// @route   POST /api/v1/teams
// @desc    Create a new team
// @access  Private
router.post('/', authenticateToken, validateRequest(createTeamSchema), asyncHandler(async (req, res) => {
  const { name, description, sport, founded, location, website, contactEmail } = req.body;
  const userId = req.user.id;

  try {
    // Check if user already owns a team
    const existingTeam = await db.findOne('teams', { owner_id: userId });
    if (existingTeam) {
      throw new ValidationError('User already owns a team');
    }

    // Create team
    const team = await db.create('teams', {
      name,
      description,
      sport,
      founded: founded ? new Date(founded) : null,
      location,
      website,
      contact_email: contactEmail,
      owner_id: userId,
      created_at: new Date(),
      updated_at: new Date()
    });

    // Add owner as team member with 'owner' role
    await db.create('team_memberships', {
      team_id: team.id,
      user_id: userId,
      role: 'owner',
      status: 'active',
      joined_at: new Date()
    });

    // Format response
    const formattedTeam = formatTeam(team);

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: formattedTeam
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    console.error('Create team error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create team',
      details: error.message
    });
  }
}));

// @route   GET /api/v1/teams
// @desc    Get teams with filtering
// @access  Private
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const { sport, location, limit = 20, offset = 0 } = req.query;

  try {
    // Build query conditions
    let conditions = 'WHERE 1=1';
    const params = [];
    let paramIndex = 0;

    if (sport) {
      conditions += ` AND t.sport = $${++paramIndex}`;
      params.push(sport);
    }

    if (location) {
      conditions += ` AND t.location ILIKE $${++paramIndex}`;
      params.push(`%${location}%`);
    }

    // Get teams
    const teams = await db.query(`
      SELECT 
        t.id,
        t.name,
        t.description,
        t.sport,
        t.founded,
        t.location,
        t.website,
        t.contact_email,
        t.owner_id,
        t.created_at,
        t.updated_at,
        u.first_name as owner_first_name,
        u.last_name as owner_last_name
      FROM teams t
      JOIN users u ON t.owner_id = u.id
      ${conditions}
      ORDER BY t.name ASC
      LIMIT $${++paramIndex} OFFSET $${++paramIndex}
    `, [...params, parseInt(limit), parseInt(offset)]);

    // Get total count
    const countResult = await db.query(`
      SELECT COUNT(*) as count
      FROM teams t
      ${conditions}
    `, params);

    const totalCount = parseInt(countResult.rows ? countResult.rows[0].count : countResult[0].count);

    res.json({
      success: true,
      data: {
        teams: (teams.rows || teams).map(team => ({
          ...formatTeam(team),
          ownerName: `${team.owner_first_name} ${team.owner_last_name}`
        })),
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      }
    });
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch teams',
      details: error.message
    });
  }
}));

// @route   GET /api/v1/teams/:teamId
// @desc    Get a specific team
// @access  Private
router.get('/:teamId', authenticateToken, asyncHandler(async (req, res) => {
  const { teamId } = req.params;

  try {
    // Get team with owner details
    const teamResult = await db.query(`
      SELECT 
        t.id,
        t.name,
        t.description,
        t.sport,
        t.founded,
        t.location,
        t.website,
        t.contact_email,
        t.owner_id,
        t.created_at,
        t.updated_at,
        u.first_name as owner_first_name,
        u.last_name as owner_last_name,
        u.email as owner_email
      FROM teams t
      JOIN users u ON t.owner_id = u.id
      WHERE t.id = $1
    `, [teamId]);

    const team = teamResult.rows ? teamResult.rows[0] : teamResult[0];
    if (!team) {
      throw new NotFoundError('Team not found');
    }

    // Get team members
    const membersResult = await db.query(`
      SELECT 
        tm.id,
        tm.user_id,
        tm.role,
        tm.status,
        tm.joined_at,
        u.first_name,
        u.last_name,
        u.email
      FROM team_memberships tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = $1 AND tm.status = 'active'
      ORDER BY tm.role, u.first_name, u.last_name
    `, [teamId]);

    const members = membersResult.rows || membersResult;

    res.json({
      success: true,
      data: {
        team: {
          ...formatTeam(team),
          ownerName: `${team.owner_first_name} ${team.owner_last_name}`,
          ownerEmail: team.owner_email
        },
        members
      }
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    console.error('Get team error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch team',
      details: error.message
    });
  }
}));

// @route   PUT /api/v1/teams/:teamId
// @desc    Update a team
// @access  Private (Team owners only)
router.put('/:teamId', authenticateToken, requireTeamOwnership, validateRequest(updateTeamSchema), asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const { name, description, sport, founded, location, website, contactEmail } = req.body;

  try {
    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (sport !== undefined) updateData.sport = sport;
    if (founded !== undefined) updateData.founded = new Date(founded);
    if (location !== undefined) updateData.location = location;
    if (website !== undefined) updateData.website = website;
    if (contactEmail !== undefined) updateData.contact_email = contactEmail;
    updateData.updated_at = new Date();

    // Update team
    const updatedTeam = await db.update('teams', teamId, updateData);

    // Format response
    const formattedTeam = formatTeam(updatedTeam);

    // Publish to Redis for real-time updates
    await redis.publish(`teams:${teamId}`, JSON.stringify({
      type: 'UPDATE_TEAM',
      data: formattedTeam
    }));

    res.json({
      success: true,
      message: 'Team updated successfully',
      data: formattedTeam
    });
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update team',
      details: error.message
    });
  }
}));

// @route   DELETE /api/v1/teams/:teamId
// @desc    Delete a team
// @access  Private (Team owners only)
router.delete('/:teamId', authenticateToken, requireTeamOwnership, asyncHandler(async (req, res) => {
  const { teamId } = req.params;

  try {
    // Delete related data
    // Delete team memberships
    await db.query('DELETE FROM team_memberships WHERE team_id = $1', [teamId]);
    
    // Delete matches (both home and away)
    await db.query('DELETE FROM matches WHERE home_team_id = $1 OR away_team_id = $1', [teamId]);
    
    // Delete events
    await db.query('DELETE FROM events WHERE team_id = $1', [teamId]);
    
    // Delete chat messages
    await db.query('DELETE FROM chat_messages WHERE team_id = $1', [teamId]);
    
    // Delete player match stats
    await db.query(`
      DELETE FROM player_match_stats 
      WHERE player_id IN (SELECT id FROM players WHERE team_id = $1)
    `, [teamId]);
    
    // Delete players
    await db.query('DELETE FROM players WHERE team_id = $1', [teamId]);
    
    // Delete team
    await db.delete('teams', teamId);

    // Publish to Redis for real-time updates
    await redis.publish(`teams:${teamId}`, JSON.stringify({
      type: 'DELETE_TEAM',
      data: { id: teamId }
    }));

    res.json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete team',
      details: error.message
    });
  }
}));

// @route   POST /api/v1/teams/:teamId/invite
// @desc    Invite a member to join the team
// @access  Private (Team owners/coaches only)
router.post('/:teamId/invite', authenticateToken, requireRole(['coach', 'manager']), validateRequest(inviteMemberSchema), asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const { email, role } = req.body;
  const userId = req.user.id;

  try {
    // Find team
    const team = await db.findById('teams', teamId);
    if (!team) {
      throw new NotFoundError('Team not found');
    }

    // Verify team ownership or coach role
    if (team.owner_id !== userId && req.user.role !== 'manager') {
      throw new AuthorizationError('Access denied to invite members to this team');
    }

    // Find user by email
    const user = await db.findOne('users', { email });
    if (!user) {
      throw new ValidationError('User with this email not found');
    }

    // Check if user is already a member
    const existingMembership = await db.findOne('team_memberships', {
      team_id: teamId,
      user_id: user.id
    });

    if (existingMembership) {
      throw new ValidationError('User is already a member of this team');
    }

    // Create invitation
    const invitation = await db.create('team_invitations', {
      team_id: teamId,
      user_id: user.id,
      role,
      invited_by: userId,
      status: 'pending',
      created_at: new Date(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expires in 7 days
    });

    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      data: {
        invitation: {
          id: invitation.id,
          teamId: invitation.team_id,
          userId: invitation.user_id,
          role: invitation.role,
          status: invitation.status,
          createdAt: invitation.created_at,
          expiresAt: invitation.expires_at
        }
      }
    });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof AuthorizationError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    console.error('Invite member error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send invitation',
      details: error.message
    });
  }
}));

// @route   POST /api/v1/teams/:teamId/join
// @desc    Join a team (accept invitation)
// @access  Private
router.post('/:teamId/join', authenticateToken, asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const userId = req.user.id;

  try {
    // Find pending invitation
    const invitation = await db.findOne('team_invitations', {
      team_id: teamId,
      user_id: userId,
      status: 'pending'
    });

    if (!invitation) {
      throw new ValidationError('No pending invitation found');
    }

    // Check if invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      throw new ValidationError('Invitation has expired');
    }

    // Create team membership
    await db.create('team_memberships', {
      team_id: teamId,
      user_id: userId,
      role: invitation.role,
      status: 'active',
      joined_at: new Date()
    });

    // Update invitation status
    await db.update('team_invitations', invitation.id, {
      status: 'accepted',
      accepted_at: new Date()
    });

    res.json({
      success: true,
      message: 'Successfully joined the team'
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    console.error('Join team error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to join team',
      details: error.message
    });
  }
}));

// @route   GET /api/v1/teams/:teamId/members
// @desc    Get team members
// @access  Private (Team members only)
router.get('/:teamId/members', authenticateToken, asyncHandler(async (req, res) => {
  const { teamId } = req.params;

  try {
    // Verify team membership
    const membership = await db.findOne('team_memberships', {
      team_id: teamId,
      user_id: req.user.id,
      status: 'active'
    });

    if (!membership && req.user.role !== 'admin') {
      throw new AuthorizationError('Access denied to view team members');
    }

    // Get team members
    const membersResult = await db.query(`
      SELECT 
        tm.id,
        tm.user_id,
        tm.role,
        tm.status,
        tm.joined_at,
        u.first_name,
        u.last_name,
        u.email
      FROM team_memberships tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = $1 AND tm.status = 'active'
      ORDER BY tm.role, u.first_name, u.last_name
    `, [teamId]);

    const members = membersResult.rows || membersResult;

    res.json({
      success: true,
      data: {
        members
      }
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    console.error('Get team members error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch team members',
      details: error.message
    });
  }
}));

export default router;