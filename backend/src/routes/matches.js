const express = require('express');
const Joi = require('joi');
const databaseService = require('../services/database');
const logger = require('../services/logger');
const { 
  asyncHandler, 
  validateRequest, 
  ValidationError, 
  NotFoundError, 
  AuthorizationError 
} = require('../middleware/errorHandler.js');
const { 
  authenticateToken, 
  requireRole, 
  checkTeamOwnership 
} = require('../middleware/auth.js');

const router = express.Router();
const db = databaseService;

// --- Socket.io Integration ---
// The router will be initialized with the io object
module.exports = (io) => {

  // --- Validation Schemas ---
  const createMatchSchema = Joi.object({
    body: Joi.object({
      teamId: Joi.string().uuid().required(),
      opponentId: Joi.string().uuid().optional().allow(null),
      opponentName: Joi.string().max(100).when('opponentId', { is: Joi.not(null), then: Joi.optional(), otherwise: Joi.required() }),
      date: Joi.date().iso().required(),
      location: Joi.string().max(255).required(),
      competition: Joi.string().max(100).required(),
      isHome: Joi.boolean().required()
    })
  });

  const updateMatchSchema = Joi.object({
    body: Joi.object({
      opponentId: Joi.string().uuid().optional().allow(null),
      opponentName: Joi.string().max(100).optional(),
      date: Joi.date().iso().optional(),
      location: Joi.string().max(255).optional(),
      competition: Joi.string().max(100).optional(),
      status: Joi.string().valid('scheduled', 'live', 'completed', 'postponed', 'cancelled').optional()
    })
  });

  const scoreUpdateSchema = Joi.object({
    body: Joi.object({
      homeScore: Joi.number().integer().min(0).required(),
      awayScore: Joi.number().integer().min(0).required()
    })
  });

  const eventSchema = Joi.object({
    body: Joi.object({
      type: Joi.string().valid('goal', 'yellow_card', 'red_card', 'substitution', 'injury').required(),
      minute: Joi.number().integer().min(0).required(),
      playerId: Joi.string().uuid().required(),
      teamId: Joi.string().uuid().required(),
      details: Joi.object().optional()
    })
  });


  // --- Routes ---

  // @route   GET /api/v1/matches
  // @desc    Get all matches
  // @access  Private
  router.get('/', authenticateToken, asyncHandler(async (req, res) => {
    const { teamId, status, competition, page = 1, limit = 20 } = req.query;
    let query = 'SELECT m.*, ht.name as home_team_name, at.name as away_team_name FROM matches m JOIN teams ht ON m.home_team_id = ht.id LEFT JOIN teams at ON m.away_team_id = at.id';
    const params = [];
    let paramCount = 0;

    let whereClauses = [];
    if (teamId) {
      whereClauses.push(`(m.home_team_id = $${++paramCount} OR m.away_team_id = $${++paramCount})`);
      params.push(teamId, teamId);
    }
    if (status) {
      whereClauses.push(`m.status = $${++paramCount}`);
      params.push(status);
    }
    if (competition) {
      whereClauses.push(`m.competition = $${++paramCount}`);
      params.push(competition);
    }

    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }

    query += ` ORDER BY m.date DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const matches = await db.query(query, params);
    res.json({ matches });
  }));

  // @route   POST /api/v1/matches
  // @desc    Create a new match
  // @access  Private (Coach, Manager, Admin)
  router.post('/', authenticateToken, requireRole(['coach', 'manager', 'admin']), validateRequest(createMatchSchema), asyncHandler(async (req, res) => {
    const { teamId, opponentId, opponentName, date, location, competition, isHome } = req.body;

    // Authorization: Ensure user can manage the team
    await checkTeamOwnership(req.user, teamId);

    const home_team_id = isHome ? teamId : opponentId;
    const away_team_id = isHome ? opponentId : teamId;
    const away_team_name = opponentId ? null : opponentName; // Only store name if opponent is not in the system

    const newMatch = await db.create('matches', {
      home_team_id,
      away_team_id,
      away_team_name,
      date,
      location,
      competition,
      status: 'scheduled',
      created_by: req.user.id
    });

    res.status(201).json({ message: 'Match created successfully', match: newMatch });
  }));

  // @route   GET /api/v1/matches/:id
  // @desc    Get match details
  // @access  Private
  router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const match = await db.query('SELECT m.*, ht.name as home_team_name, at.name as away_team_name FROM matches m JOIN teams ht ON m.home_team_id = ht.id LEFT JOIN teams at ON m.away_team_id = at.id WHERE m.id = $1', [id]);
    
    if (!match || match.length === 0) {
      throw new NotFoundError('Match not found');
    }

    // Fetch match events
    const events = await db.query('SELECT * FROM match_events WHERE match_id = $1 ORDER BY minute ASC', [id]);
    match[0].events = events;

    res.json({ match: match[0] });
  }));

  // @route   PUT /api/v1/matches/:id
  // @desc    Update match details
  // @access  Private (Coach, Manager, Admin)
  router.put('/:id', authenticateToken, requireRole(['coach', 'manager', 'admin']), validateRequest(updateMatchSchema), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    const match = await db.findById('matches', id);
    if (!match) {
        throw new NotFoundError('Match not found');
    }

    // Authorization: User must own either home or away team
    await checkTeamOwnership(req.user, match.home_team_id);
    // In a scenario where the opponent is also a team in the system, you might also check ownership of the away_team_id

    const updatedMatch = await db.update('matches', id, updates);

    io.to(`match_${id}`).emit('match_updated', { match: updatedMatch });

    res.json({ message: 'Match updated successfully', match: updatedMatch });
  }));

  // @route   PUT /api/v1/matches/:id/score
  // @desc    Update match score (live)
  // @access  Private (Coach, Manager, Admin)
  router.put('/:id/score', authenticateToken, requireRole(['coach', 'manager', 'admin']), validateRequest(scoreUpdateSchema), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { homeScore, awayScore } = req.body;

    const match = await db.findById('matches', id);
    if (!match) {
        throw new NotFoundError('Match not found');
    }

    await checkTeamOwnership(req.user, match.home_team_id); 

    const updatedMatch = await db.update('matches', id, { home_score: homeScore, away_score: awayScore, status: 'live' });

    // Emit score update to clients
    io.to(`match_${id}`).emit('score_update', { homeScore, awayScore });

    res.json({ message: 'Score updated', match: updatedMatch });
  }));

  // @route   POST /api/v1/matches/:id/events
  // @desc    Add a live match event
  // @access  Private (Coach, Manager, Admin)
  router.post('/:id/events', authenticateToken, requireRole(['coach', 'manager', 'admin']), validateRequest(eventSchema), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const eventData = req.body;

    const match = await db.findById('matches', id);
    if (!match) {
        throw new NotFoundError('Match not found');
    }

    await checkTeamOwnership(req.user, eventData.teamId);

    const newEvent = await db.create('match_events', { match_id: id, ...eventData });

    // Broadcast the event to all clients watching the match
    io.to(`match_${id}`).emit('new_event', { event: newEvent });

    // Potentially update player stats as well
    if (newEvent.type === 'goal') {
      // This is a simplified example. A robust implementation would handle this in a separate service.
      const playerStats = await db.findOne('player_match_stats', { player_id: newEvent.playerId, match_id: id });
      if(playerStats) {
        await db.update('player_match_stats', playerStats.id, { goals: (playerStats.goals || 0) + 1 });
      }
    }

    res.status(201).json({ message: 'Event added', event: newEvent });
  }));

  return router;
};