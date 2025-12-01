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
const createPlayerSchema = Joi.object({
  body: Joi.object({
    firstName: Joi.string().min(1).max(50).required(),
    lastName: Joi.string().min(1).max(50).required(),
    email: Joi.string().email().required(),
    dateOfBirth: Joi.date().iso().required(),
    position: Joi.string().valid('goalkeeper', 'defender', 'midfielder', 'forward').required(),
    jerseyNumber: Joi.number().integer().min(1).max(99).required(),
    height: Joi.number().integer().min(100).max(250).optional(),
    weight: Joi.number().integer().min(30).max(150).optional(),
    teamId: Joi.string().uuid().required(),
    phoneNumber: Joi.string().optional(),
    address: Joi.string().max(200).optional(),
    emergencyContact: Joi.object({
      name: Joi.string().max(100).optional(),
      phone: Joi.string().optional()
    }).optional()
  })
});

const updatePlayerSchema = Joi.object({
  body: Joi.object({
    firstName: Joi.string().min(1).max(50).optional(),
    lastName: Joi.string().min(1).max(50).optional(),
    email: Joi.string().email().optional(),
    dateOfBirth: Joi.date().iso().optional(),
    position: Joi.string().valid('goalkeeper', 'defender', 'midfielder', 'forward').optional(),
    jerseyNumber: Joi.number().integer().min(1).max(99).optional(),
    height: Joi.number().integer().min(100).max(250).optional(),
    weight: Joi.number().integer().min(30).max(150).optional(),
    phoneNumber: Joi.string().optional(),
    address: Joi.string().max(200).optional(),
    emergencyContact: Joi.object({
      name: Joi.string().max(100).optional(),
      phone: Joi.string().optional()
    }).optional()
  })
});

const getPlayerStatsSchema = Joi.object({
  query: Joi.object({
    season: Joi.string().pattern(/^\d{4}-\d{4}$/).optional(),
    competition: Joi.string().optional()
  })
});

// Helper functions
const formatPlayer = (player) => {
  return {
    id: player.id,
    firstName: player.first_name,
    lastName: player.last_name,
    email: player.email,
    dateOfBirth: player.date_of_birth,
    position: player.position,
    jerseyNumber: player.jersey_number,
    height: player.height,
    weight: player.weight,
    teamId: player.team_id,
    phoneNumber: player.phone_number,
    address: player.address,
    emergencyContact: player.emergency_contact ? JSON.parse(player.emergency_contact) : null,
    userId: player.user_id,
    createdAt: player.created_at,
    updatedAt: player.updated_at
  };
};

// Routes
// @route   POST /api/v1/players
// @desc    Create a new player
// @access  Private (Team owners/coaches only)
router.post('/', authenticateToken, requireRole(['coach', 'manager']), validateRequest(createPlayerSchema), asyncHandler(async (req, res) => {
  const { 
    firstName, 
    lastName, 
    email, 
    dateOfBirth, 
    position, 
    jerseyNumber, 
    height, 
    weight, 
    teamId, 
    phoneNumber, 
    address, 
    emergencyContact 
  } = req.body;
  
  const userId = req.user.id;

  try {
    // Verify team ownership
    const team = await db.findById('teams', teamId);
    if (!team) {
      throw new NotFoundError('Team not found');
    }

    if (team.owner_id !== userId && req.user.role !== 'manager') {
      throw new AuthorizationError('Access denied to add players to this team');
    }

    // Check if jersey number is already taken in this team
    const existingPlayer = await db.findOne('players', {
      team_id: teamId,
      jersey_number: jerseyNumber
    });

    if (existingPlayer) {
      throw new ValidationError('Jersey number is already taken in this team');
    }

    // Check if email is already registered
    const existingUser = await db.findOne('users', { email });
    let user;
    
    if (existingUser) {
      // Link existing user to player
      user = existingUser;
    } else {
      // Create new user account for player
      user = await db.create('users', {
        email,
        password: null, // Will be set by player later
        first_name: firstName,
        last_name: lastName,
        role: 'player',
        is_verified: false,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    // Create player
    const player = await db.create('players', {
      first_name: firstName,
      last_name: lastName,
      email,
      date_of_birth: new Date(dateOfBirth),
      position,
      jersey_number: jerseyNumber,
      height,
      weight,
      team_id: teamId,
      phone_number: phoneNumber,
      address,
      emergency_contact: emergencyContact ? JSON.stringify(emergencyContact) : null,
      user_id: user.id,
      created_at: new Date(),
      updated_at: new Date()
    });

    // Format response
    const formattedPlayer = formatPlayer(player);

    // Publish to Redis for real-time updates
    await redis.publish(`players:${teamId}`, JSON.stringify({
      type: 'NEW_PLAYER',
      data: formattedPlayer
    }));

    res.status(201).json({
      success: true,
      message: 'Player created successfully',
      data: formattedPlayer
    });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof AuthorizationError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    console.error('Create player error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create player',
      details: error.message
    });
  }
}));

// @route   GET /api/v1/players
// @desc    Get players with filtering
// @access  Private
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const { teamId, position, limit = 20, offset = 0 } = req.query;

  try {
    // Build query conditions
    let conditions = 'WHERE 1=1';
    const params = [];
    let paramIndex = 0;

    if (teamId) {
      conditions += ` AND p.team_id = $${++paramIndex}`;
      params.push(teamId);
    }

    if (position) {
      conditions += ` AND p.position = $${++paramIndex}`;
      params.push(position);
    }

    // Get players
    const players = await db.query(`
      SELECT 
        p.id,
        p.first_name,
        p.last_name,
        p.email,
        p.date_of_birth,
        p.position,
        p.jersey_number,
        p.height,
        p.weight,
        p.team_id,
        p.phone_number,
        p.address,
        p.emergency_contact,
        p.user_id,
        p.created_at,
        p.updated_at,
        t.name as team_name
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.id
      ${conditions}
      ORDER BY p.jersey_number ASC
      LIMIT $${++paramIndex} OFFSET $${++paramIndex}
    `, [...params, parseInt(limit), parseInt(offset)]);

    // Get total count
    const countResult = await db.query(`
      SELECT COUNT(*) as count
      FROM players p
      ${conditions}
    `, params);

    const totalCount = parseInt(countResult.rows ? countResult.rows[0].count : countResult[0].count);

    res.json({
      success: true,
      data: {
        players: (players.rows || players).map(player => ({
          ...formatPlayer(player),
          teamName: player.team_name
        })),
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      }
    });
  } catch (error) {
    console.error('Get players error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch players',
      details: error.message
    });
  }
}));

// @route   GET /api/v1/players/:playerId
// @desc    Get a specific player
// @access  Private
router.get('/:playerId', authenticateToken, asyncHandler(async (req, res) => {
  const { playerId } = req.params;

  try {
    // Get player with team details
    const playerResult = await db.query(`
      SELECT 
        p.id,
        p.first_name,
        p.last_name,
        p.email,
        p.date_of_birth,
        p.position,
        p.jersey_number,
        p.height,
        p.weight,
        p.team_id,
        p.phone_number,
        p.address,
        p.emergency_contact,
        p.user_id,
        p.created_at,
        p.updated_at,
        t.name as team_name
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.id
      WHERE p.id = $1
    `, [playerId]);

    const player = playerResult.rows ? playerResult.rows[0] : playerResult[0];
    if (!player) {
      throw new NotFoundError('Player not found');
    }

    res.json({
      success: true,
      data: {
        player: {
          ...formatPlayer(player),
          teamName: player.team_name
        }
      }
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    console.error('Get player error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch player',
      details: error.message
    });
  }
}));

// @route   PUT /api/v1/players/:playerId
// @desc    Update a player
// @access  Private (Team owners/coaches or the player themselves)
router.put('/:playerId', authenticateToken, validateRequest(updatePlayerSchema), asyncHandler(async (req, res) => {
  const { playerId } = req.params;
  const { 
    firstName, 
    lastName, 
    email, 
    dateOfBirth, 
    position, 
    jerseyNumber, 
    height, 
    weight, 
    phoneNumber, 
    address, 
    emergencyContact 
  } = req.body;
  
  const userId = req.user.id;

  try {
    // Find player
    const player = await db.findById('players', playerId);
    if (!player) {
      throw new NotFoundError('Player not found');
    }

    // Check permissions (player themselves, team owner, or manager)
    const team = await db.findById('teams', player.team_id);
    if (!team) {
      throw new NotFoundError('Team not found');
    }

    if (
      player.user_id !== userId && 
      team.owner_id !== userId && 
      req.user.role !== 'manager' && 
      req.user.role !== 'admin'
    ) {
      throw new AuthorizationError('Access denied to update this player');
    }

    // Check if jersey number is already taken (if changing)
    if (jerseyNumber !== undefined && jerseyNumber !== player.jersey_number) {
      const existingPlayer = await db.findOne('players', {
        team_id: player.team_id,
        jersey_number: jerseyNumber
      });

      if (existingPlayer && existingPlayer.id !== playerId) {
        throw new ValidationError('Jersey number is already taken in this team');
      }
    }

    // Prepare update data
    const updateData = {};
    if (firstName !== undefined) updateData.first_name = firstName;
    if (lastName !== undefined) updateData.last_name = lastName;
    if (email !== undefined) updateData.email = email;
    if (dateOfBirth !== undefined) updateData.date_of_birth = new Date(dateOfBirth);
    if (position !== undefined) updateData.position = position;
    if (jerseyNumber !== undefined) updateData.jersey_number = jerseyNumber;
    if (height !== undefined) updateData.height = height;
    if (weight !== undefined) updateData.weight = weight;
    if (phoneNumber !== undefined) updateData.phone_number = phoneNumber;
    if (address !== undefined) updateData.address = address;
    if (emergencyContact !== undefined) updateData.emergency_contact = JSON.stringify(emergencyContact);
    updateData.updated_at = new Date();

    // Update player
    const updatedPlayer = await db.update('players', playerId, updateData);

    // Format response
    const formattedPlayer = formatPlayer(updatedPlayer);

    // Publish to Redis for real-time updates
    await redis.publish(`players:${player.team_id}`, JSON.stringify({
      type: 'UPDATE_PLAYER',
      data: formattedPlayer
    }));

    res.json({
      success: true,
      message: 'Player updated successfully',
      data: formattedPlayer
    });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof AuthorizationError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    console.error('Update player error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update player',
      details: error.message
    });
  }
}));

// @route   DELETE /api/v1/players/:playerId
// @desc    Delete a player
// @access  Private (Team owners/coaches only)
router.delete('/:playerId', authenticateToken, requireRole(['coach', 'manager']), asyncHandler(async (req, res) => {
  const { playerId } = req.params;
  const userId = req.user.id;

  try {
    // Find player
    const player = await db.findById('players', playerId);
    if (!player) {
      throw new NotFoundError('Player not found');
    }

    // Verify team ownership
    const team = await db.findById('teams', player.team_id);
    if (!team) {
      throw new NotFoundError('Team not found');
    }

    if (team.owner_id !== userId && req.user.role !== 'manager' && req.user.role !== 'admin') {
      throw new AuthorizationError('Access denied to delete this player');
    }

    // Delete related player statistics
    await db.query('DELETE FROM player_match_stats WHERE player_id = $1', [playerId]);

    // Delete player
    await db.delete('players', playerId);

    // Publish to Redis for real-time updates
    await redis.publish(`players:${player.team_id}`, JSON.stringify({
      type: 'DELETE_PLAYER',
      data: { id: playerId }
    }));

    res.json({
      success: true,
      message: 'Player deleted successfully'
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AuthorizationError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    console.error('Delete player error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete player',
      details: error.message
    });
  }
}));

// @route   GET /api/v1/players/:playerId/stats
// @desc    Get player statistics
// @access  Private
router.get('/:playerId/stats', authenticateToken, validateRequest(getPlayerStatsSchema), asyncHandler(async (req, res) => {
  const { playerId } = req.params;
  const { season, competition } = req.query;

  try {
    // Find player
    const player = await db.findById('players', playerId);
    if (!player) {
      throw new NotFoundError('Player not found');
    }

    // Build query conditions
    let conditions = 'WHERE pms.player_id = $1';
    const params = [playerId];
    let paramIndex = 1;

    if (season) {
      conditions += ` AND m.season = $${++paramIndex}`;
      params.push(season);
    }

    if (competition) {
      conditions += ` AND m.competition = $${++paramIndex}`;
      params.push(competition);
    }

    // Get player statistics
    const stats = await db.query(`
      SELECT 
        COUNT(pms.id) as matches_played,
        SUM(pms.goals) as total_goals,
        SUM(pms.assists) as total_assists,
        SUM(pms.yellow_cards) as total_yellow_cards,
        SUM(pms.red_cards) as total_red_cards,
        SUM(pms.minutes_played) as total_minutes_played,
        AVG(pms.rating) as average_rating,
        SUM(pms.passes) as total_passes,
        SUM(pms.passes_completed) as total_passes_completed,
        SUM(pms.shots) as total_shots,
        SUM(pms.shots_on_target) as total_shots_on_target,
        SUM(pms.tackles) as total_tackles,
        SUM(pms.saves) as total_saves
      FROM player_match_stats pms
      JOIN matches m ON pms.match_id = m.id
      ${conditions}
      AND m.status = 'finished'
    `, params);

    // Get detailed match statistics
    const matchStats = await db.query(`
      SELECT 
        m.id as match_id,
        m.date,
        m.competition,
        m.season,
        ht.name as home_team_name,
        at.name as away_team_name,
        m.home_score,
        m.away_score,
        pms.goals,
        pms.assists,
        pms.yellow_cards,
        pms.red_cards,
        pms.minutes_played,
        pms.rating,
        pms.position,
        pms.formation
      FROM player_match_stats pms
      JOIN matches m ON pms.match_id = m.id
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      ${conditions}
      AND m.status = 'finished'
      ORDER BY m.date DESC
    `, params);

    const playerStats = stats.rows ? stats.rows[0] : stats[0];
    const playerMatchStats = matchStats.rows || matchStats;

    res.json({
      success: true,
      data: {
        player: {
          id: player.id,
          firstName: player.first_name,
          lastName: player.last_name,
          position: player.position
        },
        statistics: {
          ...playerStats,
          matches_played: parseInt(playerStats.matches_played) || 0,
          total_goals: parseInt(playerStats.total_goals) || 0,
          total_assists: parseInt(playerStats.total_assists) || 0,
          total_yellow_cards: parseInt(playerStats.total_yellow_cards) || 0,
          total_red_cards: parseInt(playerStats.total_red_cards) || 0,
          total_minutes_played: parseInt(playerStats.total_minutes_played) || 0,
          average_rating: parseFloat(playerStats.average_rating) || 0,
          total_passes: parseInt(playerStats.total_passes) || 0,
          total_passes_completed: parseInt(playerStats.total_passes_completed) || 0,
          total_shots: parseInt(playerStats.total_shots) || 0,
          total_shots_on_target: parseInt(playerStats.total_shots_on_target) || 0,
          total_tackles: parseInt(playerStats.total_tackles) || 0,
          total_saves: parseInt(playerStats.total_saves) || 0
        },
        match_history: playerMatchStats
      }
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    console.error('Get player stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch player statistics',
      details: error.message
    });
  }
}));

export default router;