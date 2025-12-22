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
const createMatchSchema = Joi.object({
  body: Joi.object({
    homeTeamId: Joi.string().uuid().required(),
    awayTeamId: Joi.string().uuid().required(),
    date: Joi.date().iso().required(),
    venue: Joi.string().max(100).optional(),
    competition: Joi.string().max(50).optional(),
    season: Joi.string().pattern(/^\d{4}-\d{4}$/).optional(),
    matchType: Joi.string().valid('league', 'cup', 'friendly', 'tournament').optional()
  })
});

const updateMatchSchema = Joi.object({
  body: Joi.object({
    homeScore: Joi.number().integer().min(0).optional(),
    awayScore: Joi.number().integer().min(0).optional(),
    status: Joi.string().valid('scheduled', 'in_progress', 'finished', 'postponed', 'cancelled').optional(),
    date: Joi.date().iso().optional(),
    venue: Joi.string().max(100).optional(),
    competition: Joi.string().max(50).optional(),
    season: Joi.string().pattern(/^\d{4}-\d{4}$/).optional(),
    matchType: Joi.string().valid('league', 'cup', 'friendly', 'tournament').optional()
  })
});

const addPlayerStatsSchema = Joi.object({
  body: Joi.object({
    playerId: Joi.string().uuid().required(),
    goals: Joi.number().integer().min(0).default(0),
    assists: Joi.number().integer().min(0).default(0),
    yellowCards: Joi.number().integer().min(0).max(2).default(0),
    redCards: Joi.number().integer().min(0).max(1).default(0),
    minutesPlayed: Joi.number().integer().min(0).max(120).default(0),
    rating: Joi.number().min(0).max(10).precision(1).optional(),
    position: Joi.string().valid('goalkeeper', 'defender', 'midfielder', 'forward').optional(),
    formation: Joi.string().max(10).optional()
  })
});

// Helper functions
const formatMatch = (match) => {
  return {
    id: match.id,
    homeTeamId: match.home_team_id,
    awayTeamId: match.away_team_id,
    homeScore: match.home_score,
    awayScore: match.away_score,
    date: match.date,
    venue: match.venue,
    competition: match.competition,
    season: match.season,
    status: match.status,
    matchType: match.match_type,
    createdAt: match.created_at,
    updatedAt: match.updated_at
  };
};

// Routes
// @route   POST /api/v1/matches
// @desc    Create a new match
// @access  Private (Admin or team owners only)
router.post('/', authenticateToken, requireRole(['admin', 'manager']), validateRequest(createMatchSchema), asyncHandler(async (req, res) => {
  const { homeTeamId, awayTeamId, date, venue, competition, season, matchType } = req.body;
  const userId = req.user.id;

  try {
    // Verify team ownership for at least one team
    const homeTeam = await db.findById('teams', homeTeamId);
    const awayTeam = await db.findById('teams', awayTeamId);

    if (!homeTeam || !awayTeam) {
      throw new ValidationError('Both teams must exist');
    }

    // Check if user owns either team
    if (
      homeTeam.owner_id !== userId && 
      awayTeam.owner_id !== userId && 
      req.user.role !== 'admin'
    ) {
      throw new AuthorizationError('Access denied to create match for these teams');
    }

    // Check if teams are the same
    if (homeTeamId === awayTeamId) {
      throw new ValidationError('Home and away teams cannot be the same');
    }

    // Create match
    const match = await db.create('matches', {
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      home_score: null,
      away_score: null,
      date: new Date(date),
      venue,
      competition,
      season,
      status: 'scheduled',
      match_type: matchType,
      created_at: new Date(),
      updated_at: new Date()
    });

    // Format response
    const formattedMatch = formatMatch(match);

    // Publish to Redis for real-time updates
    await redis.publish('matches', JSON.stringify({
      type: 'NEW_MATCH',
      data: formattedMatch
    }));

    res.status(201).json({
      success: true,
      message: 'Match created successfully',
      data: formattedMatch
    });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof AuthorizationError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    console.error('Create match error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create match',
      details: error.message
    });
  }
}));

// @route   GET /api/v1/matches
// @desc    Get matches with filtering
// @access  Private
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const { teamId, status, startDate, endDate, competition, season } = req.query;

  try {
    // Build query conditions
    let conditions = 'WHERE 1=1';
    const params = [];
    let paramIndex = 0;

    if (teamId) {
      conditions += ` AND (m.home_team_id = $${++paramIndex} OR m.away_team_id = $${paramIndex})`;
      params.push(teamId);
    }

    if (status) {
      conditions += ` AND m.status = $${++paramIndex}`;
      params.push(status);
    }

    if (startDate) {
      conditions += ` AND m.date >= $${++paramIndex}`;
      params.push(new Date(startDate));
    }

    if (endDate) {
      conditions += ` AND m.date <= $${++paramIndex}`;
      params.push(new Date(endDate));
    }

    if (competition) {
      conditions += ` AND m.competition = $${++paramIndex}`;
      params.push(competition);
    }

    if (season) {
      conditions += ` AND m.season = $${++paramIndex}`;
      params.push(season);
    }

    // Get matches with team details
    const matches = await db.query(`
      SELECT 
        m.id,
        m.home_team_id,
        m.away_team_id,
        m.home_score,
        m.away_score,
        m.date,
        m.venue,
        m.competition,
        m.season,
        m.status,
        m.match_type,
        m.created_at,
        m.updated_at,
        ht.name as home_team_name,
        at.name as away_team_name
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      ${conditions}
      ORDER BY m.date DESC
    `, params);

    res.json({
      success: true,
      data: {
        matches: (matches.rows || matches).map(match => ({
          ...formatMatch(match),
          homeTeamName: match.home_team_name,
          awayTeamName: match.away_team_name
        }))
      }
    });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch matches',
      details: error.message
    });
  }
}));

// @route   GET /api/v1/matches/:matchId
// @desc    Get a specific match
// @access  Private
router.get('/:matchId', authenticateToken, asyncHandler(async (req, res) => {
  const { matchId } = req.params;

  try {
    // Get match with team details
    const matchResult = await db.query(`
      SELECT 
        m.id,
        m.home_team_id,
        m.away_team_id,
        m.home_score,
        m.away_score,
        m.date,
        m.venue,
        m.competition,
        m.season,
        m.status,
        m.match_type,
        m.created_at,
        m.updated_at,
        ht.name as home_team_name,
        at.name as away_team_name
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE m.id = $1
    `, [matchId]);

    const match = matchResult.rows ? matchResult.rows[0] : matchResult[0];
    if (!match) {
      throw new NotFoundError('Match not found');
    }

    // Get player statistics for this match
    const playerStats = await db.query(`
      SELECT 
        pms.id,
        pms.player_id,
        pms.goals,
        pms.assists,
        pms.yellow_cards,
        pms.red_cards,
        pms.minutes_played,
        pms.rating,
        pms.position,
        pms.formation,
        p.first_name,
        p.last_name,
        p.team_id
      FROM player_match_stats pms
      JOIN players p ON pms.player_id = p.id
      WHERE pms.match_id = $1
    `, [matchId]);

    res.json({
      success: true,
      data: {
        match: {
          ...formatMatch(match),
          homeTeamName: match.home_team_name,
          awayTeamName: match.away_team_name
        },
        playerStats: playerStats.rows || playerStats
      }
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    console.error('Get match error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch match',
      details: error.message
    });
  }
}));

// @route   PUT /api/v1/matches/:matchId
// @desc    Update a match
// @access  Private (Admin or team owners)
router.put('/:matchId', authenticateToken, requireRole(['admin', 'manager']), validateRequest(updateMatchSchema), asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  const { homeScore, awayScore, status, date, venue, competition, season, matchType } = req.body;
  const userId = req.user.id;

  try {
    // Find match
    const match = await db.findById('matches', matchId);
    if (!match) {
      throw new NotFoundError('Match not found');
    }

    // Verify team ownership
    const homeTeam = await db.findById('teams', match.home_team_id);
    const awayTeam = await db.findById('teams', match.away_team_id);

    if (
      homeTeam.owner_id !== userId && 
      awayTeam.owner_id !== userId && 
      req.user.role !== 'admin'
    ) {
      throw new AuthorizationError('Access denied to update this match');
    }

    // Prepare update data
    const updateData = {};
    if (homeScore !== undefined) updateData.home_score = homeScore;
    if (awayScore !== undefined) updateData.away_score = awayScore;
    if (status !== undefined) updateData.status = status;
    if (date !== undefined) updateData.date = new Date(date);
    if (venue !== undefined) updateData.venue = venue;
    if (competition !== undefined) updateData.competition = competition;
    if (season !== undefined) updateData.season = season;
    if (matchType !== undefined) updateData.match_type = matchType;
    updateData.updated_at = new Date();

    // Update match
    const updatedMatch = await db.update('matches', matchId, updateData);

    // Format response
    const formattedMatch = formatMatch(updatedMatch);

    // Publish to Redis for real-time updates
    await redis.publish('matches', JSON.stringify({
      type: 'UPDATE_MATCH',
      data: formattedMatch
    }));

    res.json({
      success: true,
      message: 'Match updated successfully',
      data: formattedMatch
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AuthorizationError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    console.error('Update match error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update match',
      details: error.message
    });
  }
}));

// @route   DELETE /api/v1/matches/:matchId
// @desc    Delete a match
// @access  Private (Admin only)
router.delete('/:matchId', authenticateToken, requireRole(['admin']), asyncHandler(async (req, res) => {
  const { matchId } = req.params;

  try {
    // Find match
    const match = await db.findById('matches', matchId);
    if (!match) {
      throw new NotFoundError('Match not found');
    }

    // Delete related player statistics
    await db.query('DELETE FROM player_match_stats WHERE match_id = $1', [matchId]);

    // Delete match
    await db.delete('matches', matchId);

    // Publish to Redis for real-time updates
    await redis.publish('matches', JSON.stringify({
      type: 'DELETE_MATCH',
      data: { id: matchId }
    }));

    res.json({
      success: true,
      message: 'Match deleted successfully'
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    console.error('Delete match error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete match',
      details: error.message
    });
  }
}));

// @route   POST /api/v1/matches/:matchId/player-stats
// @desc    Add player statistics for a match
// @access  Private (Team owners or managers)
router.post('/:matchId/player-stats', authenticateToken, requireRole(['admin', 'manager']), validateRequest(addPlayerStatsSchema), asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  const { 
    playerId, 
    goals, 
    assists, 
    yellowCards, 
    redCards, 
    minutesPlayed, 
    rating, 
    position, 
    formation 
  } = req.body;
  
  const userId = req.user.id;

  try {
    // Find match
    const match = await db.findById('matches', matchId);
    if (!match) {
      throw new NotFoundError('Match not found');
    }

    // Find player
    const player = await db.findById('players', playerId);
    if (!player) {
      throw new ValidationError('Player not found');
    }

    // Verify team ownership (player's team must be one of the match teams)
    if (
      player.team_id !== match.home_team_id && 
      player.team_id !== match.away_team_id
    ) {
      throw new AuthorizationError('Player is not part of this match');
    }

    // Verify user has permission to add stats for this player's team
    const playerTeam = await db.findById('teams', player.team_id);
    if (
      playerTeam.owner_id !== userId && 
      req.user.role !== 'admin'
    ) {
      throw new AuthorizationError('Access denied to add stats for this player');
    }

    // Check if stats already exist for this player in this match
    const existingStats = await db.findOne('player_match_stats', {
      match_id: matchId,
      player_id: playerId
    });

    let stats;
    if (existingStats) {
      // Update existing stats
      stats = await db.update('player_match_stats', existingStats.id, {
        goals,
        assists,
        yellow_cards: yellowCards,
        red_cards: redCards,
        minutes_played: minutesPlayed,
        rating,
        position,
        formation,
        updated_at: new Date()
      });
    } else {
      // Create new stats
      stats = await db.create('player_match_stats', {
        match_id: matchId,
        player_id: playerId,
        goals,
        assists,
        yellow_cards: yellowCards,
        red_cards: redCards,
        minutes_played: minutesPlayed,
        rating,
        position,
        formation,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    res.status(201).json({
      success: true,
      message: existingStats ? 'Player stats updated successfully' : 'Player stats added successfully',
      data: stats
    });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof AuthorizationError || error instanceof NotFoundError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    console.error('Add player stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add player stats',
      details: error.message
    });
  }
}));

export default router;