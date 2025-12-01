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
const analyticsQuerySchema = Joi.object({
  query: Joi.object({
    startDate: Joi.date().optional(),
    endDate: Joi.date().min(Joi.ref('startDate')).optional(),
    teamId: Joi.string().uuid().optional(),
    playerId: Joi.string().uuid().optional(),
    position: Joi.string().valid('goalkeeper', 'defender', 'midfielder', 'forward').optional(),
    competition: Joi.string().valid('league', 'cup', 'friendly', 'tournament').optional(),
    season: Joi.string().pattern(/^\d{4}-\d{4}$/).optional(),
    metric: Joi.string().valid('goals', 'assists', 'rating', 'minutes', 'passes', 'shots').optional(),
    groupBy: Joi.string().valid('player', 'team', 'position', 'month', 'competition').optional()
  })
});

const customReportSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(500).optional(),
    filters: Joi.object({
      startDate: Joi.date().optional(),
      endDate: Joi.date().optional(),
      teamIds: Joi.array().items(Joi.string().uuid()).optional(),
      playerIds: Joi.array().items(Joi.string().uuid()).optional(),
      positions: Joi.array().items(Joi.string().valid('goalkeeper', 'defender', 'midfielder', 'forward')).optional(),
      competitions: Joi.array().items(Joi.string()).optional()
    }).required(),
    metrics: Joi.array().items(Joi.string().valid(
      'goals', 'assists', 'rating', 'minutes', 'passes', 'passes_completed',
      'shots', 'shots_on_target', 'saves', 'tackles', 'yellow_cards', 'red_cards'
    )).min(1).required(),
    groupBy: Joi.string().valid('player', 'team', 'position', 'month', 'competition').required(),
    chartType: Joi.string().valid('bar', 'line', 'pie', 'scatter', 'table').required()
  })
});

// Helper functions
const buildAnalyticsQuery = (filters, metrics, groupBy) => {
  let selectClause = '';
  let fromClause = `
    FROM player_match_stats pms
    JOIN players p ON pms.player_id = p.id
    JOIN matches m ON pms.match_id = m.id
    JOIN teams t ON p.team_id = t.id
  `;
  let whereClause = 'WHERE 1=1';
  let groupByClause = '';
  let orderByClause = '';
  const params = [];
  let paramCount = 0;

  // Build SELECT clause based on groupBy and metrics
  switch (groupBy) {
    case 'player':
      selectClause = `
        p.id as player_id,
        p.first_name,
        p.last_name,
        p.position,
        t.name as team_name,
        COUNT(pms.id) as matches_played
      `;
      groupByClause = 'GROUP BY p.id, p.first_name, p.last_name, p.position, t.name';
      orderByClause = 'ORDER BY matches_played DESC';
      break;
    case 'team':
      selectClause = `
        t.id as team_id,
        t.name as team_name,
        COUNT(DISTINCT pms.player_id) as players_count,
        COUNT(pms.id) as total_appearances
      `;
      groupByClause = 'GROUP BY t.id, t.name';
      orderByClause = 'ORDER BY total_appearances DESC';
      break;
    case 'position':
      selectClause = `
        p.position,
        COUNT(DISTINCT p.id) as players_count,
        COUNT(pms.id) as total_appearances
      `;
      groupByClause = 'GROUP BY p.position';
      orderByClause = 'ORDER BY total_appearances DESC';
      break;
    case 'month':
      selectClause = `
        DATE_TRUNC('month', m.date) as month,
        COUNT(pms.id) as matches_played
      `;
      groupByClause = 'GROUP BY DATE_TRUNC(\'month\', m.date)';
      orderByClause = 'ORDER BY month ASC';
      break;
    case 'competition':
      selectClause = `
        m.competition,
        COUNT(pms.id) as matches_played,
        COUNT(DISTINCT p.id) as unique_players
      `;
      groupByClause = 'GROUP BY m.competition';
      orderByClause = 'ORDER BY matches_played DESC';
      break;
  }

  // Add metric aggregations
  metrics.forEach(metric => {
    switch (metric) {
      case 'goals':
        selectClause += ', SUM(pms.goals) as total_goals, AVG(pms.goals) as avg_goals';
        break;
      case 'assists':
        selectClause += ', SUM(pms.assists) as total_assists, AVG(pms.assists) as avg_assists';
        break;
      case 'rating':
        selectClause += ', AVG(pms.rating) as avg_rating, MAX(pms.rating) as max_rating';
        break;
      case 'minutes':
        selectClause += ', SUM(pms.minutes_played) as total_minutes, AVG(pms.minutes_played) as avg_minutes';
        break;
      case 'passes':
        selectClause += ', SUM(pms.passes) as total_passes, AVG(pms.passes) as avg_passes';
        break;
      case 'passes_completed':
        selectClause += ', SUM(pms.passes_completed) as total_passes_completed, AVG(pms.passes_completed) as avg_passes_completed';
        break;
      case 'shots':
        selectClause += ', SUM(pms.shots) as total_shots, AVG(pms.shots) as avg_shots';
        break;
      case 'shots_on_target':
        selectClause += ', SUM(pms.shots_on_target) as total_shots_on_target, AVG(pms.shots_on_target) as avg_shots_on_target';
        break;
      case 'saves':
        selectClause += ', SUM(pms.saves) as total_saves, AVG(pms.saves) as avg_saves';
        break;
      case 'tackles':
        selectClause += ', SUM(pms.tackles) as total_tackles, AVG(pms.tackles) as avg_tackles';
        break;
      case 'yellow_cards':
        selectClause += ', SUM(pms.yellow_cards) as total_yellow_cards';
        break;
      case 'red_cards':
        selectClause += ', SUM(pms.red_cards) as total_red_cards';
        break;
    }
  });

  // Build WHERE clause based on filters
  if (filters.startDate) {
    whereClause += ` AND m.date >= $${++paramCount}`;
    params.push(filters.startDate);
  }

  if (filters.endDate) {
    whereClause += ` AND m.date <= $${++paramCount}`;
    params.push(filters.endDate);
  }

  if (filters.teamIds && filters.teamIds.length > 0) {
    whereClause += ` AND t.id = ANY($${++paramCount})`;
    params.push(filters.teamIds);
  }

  if (filters.playerIds && filters.playerIds.length > 0) {
    whereClause += ` AND p.id = ANY($${++paramCount})`;
    params.push(filters.playerIds);
  }

  if (filters.positions && filters.positions.length > 0) {
    whereClause += ` AND p.position = ANY($${++paramCount})`;
    params.push(filters.positions);
  }

  if (filters.competitions && filters.competitions.length > 0) {
    whereClause += ` AND m.competition = ANY($${++paramCount})`;
    params.push(filters.competitions);
  }

  if (filters.season) {
    whereClause += ` AND m.season = $${++paramCount}`;
    params.push(filters.season);
  }

  const query = `
    SELECT ${selectClause}
    ${fromClause}
    ${whereClause}
    ${groupByClause}
    ${orderByClause}
  `;

  return { query, params };
};

// Routes
// @route   GET /api/v1/analytics/dashboard/:teamId
// @desc    Get dashboard analytics for a team
// @access  Private (Team members only)
router.get('/dashboard/:teamId', authenticateToken, requireTeamOwnership, asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  
  try {
    // Get recent matches
    const recentMatches = await db.query(`
      SELECT 
        m.id,
        m.home_team_id,
        m.away_team_id,
        ht.name as home_team_name,
        at.name as away_team_name,
        m.home_score,
        m.away_score,
        m.date,
        m.competition,
        m.status
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE (m.home_team_id = $1 OR m.away_team_id = $1)
        AND m.date >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY m.date DESC
      LIMIT 5
    `, [teamId]);

    // Get team statistics
    const teamStats = await db.query(`
      SELECT 
        COUNT(*) as total_matches,
        SUM(CASE WHEN (m.home_team_id = $1 AND m.home_score > m.away_score) OR (m.away_team_id = $1 AND m.away_score > m.home_score) THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN m.home_score = m.away_score THEN 1 ELSE 0 END) as draws,
        SUM(CASE WHEN (m.home_team_id = $1 AND m.home_score < m.away_score) OR (m.away_team_id = $1 AND m.away_score < m.home_score) THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN m.home_team_id = $1 THEN m.home_score ELSE m.away_score END) as goals_for,
        SUM(CASE WHEN m.home_team_id = $1 THEN m.away_score ELSE m.home_score END) as goals_against,
        AVG(CASE WHEN m.home_team_id = $1 THEN m.home_score ELSE m.away_score END) as avg_goals_for,
        AVG(CASE WHEN m.home_team_id = $1 THEN m.away_score ELSE m.away_score END) as avg_goals_against
      FROM matches m
      WHERE (m.home_team_id = $1 OR m.away_team_id = $1)
        AND m.status = 'finished'
    `, [teamId]);

    // Get top performers
    const topPerformers = await db.query(`
      SELECT 
        p.id as player_id,
        p.first_name,
        p.last_name,
        p.position,
        COUNT(pms.id) as appearances,
        SUM(pms.goals) as total_goals,
        SUM(pms.assists) as total_assists,
        AVG(pms.rating) as avg_rating
      FROM players p
      JOIN player_match_stats pms ON p.id = pms.player_id
      JOIN matches m ON pms.match_id = m.id
      WHERE p.team_id = $1
        AND m.status = 'finished'
      GROUP BY p.id, p.first_name, p.last_name, p.position
      ORDER BY avg_rating DESC
      LIMIT 5
    `, [teamId]);

    res.json({
      success: true,
      data: {
        recentMatches: recentMatches.rows || recentMatches,
        teamStats: teamStats.rows ? teamStats.rows[0] : teamStats[0],
        topPerformers: topPerformers.rows || topPerformers
      }
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard analytics',
      details: error.message
    });
  }
}));

// @route   GET /api/v1/analytics/team/:teamId
// @desc    Get detailed team analytics
// @access  Private (Team members only)
router.get('/team/:teamId', authenticateToken, requireTeamOwnership, validateRequest(analyticsQuerySchema), asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const filters = req.query;

  try {
    // Get team performance over time
    const performanceOverTime = await db.query(`
      SELECT 
        DATE_TRUNC('week', m.date) as week,
        COUNT(*) as matches_played,
        SUM(CASE WHEN (m.home_team_id = $1 AND m.home_score > m.away_score) OR (m.away_team_id = $1 AND m.away_score > m.home_score) THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN m.home_score = m.away_score THEN 1 ELSE 0 END) as draws,
        SUM(CASE WHEN (m.home_team_id = $1 AND m.home_score < m.away_score) OR (m.away_team_id = $1 AND m.away_score < m.home_score) THEN 1 ELSE 0 END) as losses,
        AVG(CASE WHEN m.home_team_id = $1 THEN m.home_score ELSE m.away_score END) as avg_goals_for,
        AVG(CASE WHEN m.home_team_id = $1 THEN m.away_score ELSE m.home_score END) as avg_goals_against
      FROM matches m
      WHERE (m.home_team_id = $1 OR m.away_team_id = $1)
        AND m.status = 'finished'
        ${filters.startDate ? 'AND m.date >= $2' : ''}
        ${filters.endDate ? `AND m.date <= $${filters.startDate ? 3 : 2}` : ''}
      GROUP BY DATE_TRUNC('week', m.date)
      ORDER BY week ASC
    `, [teamId, ...(filters.startDate ? [filters.startDate] : []), ...(filters.endDate ? [filters.endDate] : [])]);

    // Get formation effectiveness
    const formationEffectiveness = await db.query(`
      SELECT 
        p.formation,
        COUNT(*) as matches_played,
        SUM(CASE WHEN (m.home_team_id = $1 AND m.home_score > m.away_score) OR (m.away_team_id = $1 AND m.away_score > m.home_score) THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN m.home_score = m.away_score THEN 1 ELSE 0 END) as draws,
        SUM(CASE WHEN (m.home_team_id = $1 AND m.home_score < m.away_score) OR (m.away_team_id = $1 AND m.away_score < m.home_score) THEN 1 ELSE 0 END) as losses,
        AVG(CASE WHEN m.home_team_id = $1 THEN m.home_score ELSE m.away_score END) as avg_goals_for,
        AVG(CASE WHEN m.home_team_id = $1 THEN m.away_score ELSE m.home_score END) as avg_goals_against
      FROM matches m
      JOIN player_match_stats pms ON m.id = pms.match_id
      JOIN players p ON pms.player_id = p.id
      WHERE (m.home_team_id = $1 OR m.away_team_id = $1)
        AND m.status = 'finished'
        AND p.team_id = $1
        ${filters.startDate ? 'AND m.date >= $2' : ''}
        ${filters.endDate ? `AND m.date <= $${filters.startDate ? 3 : 2}` : ''}
      GROUP BY p.formation
      ORDER BY wins DESC
    `, [teamId, ...(filters.startDate ? [filters.startDate] : []), ...(filters.endDate ? [filters.endDate] : [])]);

    res.json({
      success: true,
      data: {
        performanceOverTime: performanceOverTime.rows || performanceOverTime,
        formationEffectiveness: formationEffectiveness.rows || formationEffectiveness
      }
    });
  } catch (error) {
    console.error('Team analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch team analytics',
      details: error.message
    });
  }
}));

// @route   GET /api/v1/analytics/player/:playerId
// @desc    Get detailed player analytics
// @access  Private (Player or team member)
router.get('/player/:playerId', authenticateToken, asyncHandler(async (req, res) => {
  const { playerId } = req.params;

  try {
    // Check if user can access this player's data
    const player = await db.findById('players', playerId);
    if (!player) {
      throw new NotFoundError('Player not found');
    }

    // Check team ownership (players can view their own data, coaches/managers can view their team's players)
    if (req.user.id !== player.user_id && req.user.role !== 'coach' && req.user.role !== 'manager') {
      const userTeam = await db.findById('teams', req.user.teamId);
      if (!userTeam || userTeam.owner_id !== req.user.id) {
        throw new AuthorizationError('Access denied to this player\'s analytics');
      }
    }

    // Get player performance over time
    const performanceOverTime = await db.query(`
      SELECT 
        m.date,
        m.competition,
        pms.goals,
        pms.assists,
        pms.rating,
        pms.minutes_played,
        pms.passes,
        pms.passes_completed,
        pms.shots,
        pms.shots_on_target,
        pms.tackles,
        pms.saves
      FROM player_match_stats pms
      JOIN matches m ON pms.match_id = m.id
      WHERE pms.player_id = $1
        AND m.status = 'finished'
      ORDER BY m.date ASC
    `, [playerId]);

    // Get aggregated statistics
    const aggregatedStats = await db.query(`
      SELECT 
        COUNT(*) as total_matches,
        SUM(pms.goals) as total_goals,
        SUM(pms.assists) as total_assists,
        AVG(pms.rating) as avg_rating,
        SUM(pms.minutes_played) as total_minutes,
        SUM(pms.passes) as total_passes,
        SUM(pms.passes_completed) as total_passes_completed,
        SUM(pms.shots) as total_shots,
        SUM(pms.shots_on_target) as total_shots_on_target,
        SUM(pms.tackles) as total_tackles,
        SUM(pms.saves) as total_saves,
        MAX(pms.goals) as max_goals_in_match,
        MAX(pms.assists) as max_assists_in_match,
        MAX(pms.rating) as max_rating
      FROM player_match_stats pms
      JOIN matches m ON pms.match_id = m.id
      WHERE pms.player_id = $1
        AND m.status = 'finished'
    `, [playerId]);

    res.json({
      success: true,
      data: {
        player: {
          id: player.id,
          name: `${player.first_name} ${player.last_name}`,
          position: player.position,
          team_id: player.team_id
        },
        performanceOverTime: performanceOverTime.rows || performanceOverTime,
        aggregatedStats: aggregatedStats.rows ? aggregatedStats.rows[0] : aggregatedStats[0]
      }
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AuthorizationError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    console.error('Player analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch player analytics',
      details: error.message
    });
  }
}));

// @route   POST /api/v1/analytics/reports
// @desc    Create a custom analytics report
// @access  Private
router.post('/reports', authenticateToken, validateRequest(customReportSchema), asyncHandler(async (req, res) => {
  const { name, description, filters, metrics, groupBy, chartType } = req.body;
  const userId = req.user.id;

  try {
    // Build and execute the analytics query
    const { query, params } = buildAnalyticsQuery(filters, metrics, groupBy);
    const results = await db.query(query, params);

    // Save the report
    const report = await db.create('analytics_reports', {
      name,
      description,
      filters: JSON.stringify(filters),
      metrics: JSON.stringify(metrics),
      group_by: groupBy,
      chart_type: chartType,
      data: JSON.stringify(results.rows || results),
      created_by: userId,
      created_at: new Date(),
      updated_at: new Date()
    });

    res.status(201).json({
      success: true,
      data: {
        report: {
          id: report.id,
          name: report.name,
          description: report.description,
          chart_type: report.chart_type,
          created_at: report.created_at
        },
        results: results.rows || results
      },
      message: 'Custom report created successfully'
    });
  } catch (error) {
    console.error('Custom report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create custom report',
      details: error.message
    });
  }
}));

// @route   GET /api/v1/analytics/reports
// @desc    Get user's analytics reports
// @access  Private
router.get('/reports', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const reports = await db.findMany('analytics_reports', { created_by: req.user.id }, { orderBy: 'created_at', ascending: false });

    res.json({
      success: true,
      data: {
        reports: reports.map(report => ({
          id: report.id,
          name: report.name,
          description: report.description,
          chart_type: report.chart_type,
          created_at: report.created_at,
          updated_at: report.updated_at
        }))
      }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reports',
      details: error.message
    });
  }
}));

// @route   GET /api/v1/analytics/reports/:reportId
// @desc    Get a specific analytics report
// @access  Private
router.get('/reports/:reportId', authenticateToken, asyncHandler(async (req, res) => {
  const { reportId } = req.params;

  try {
    const report = await db.findById('analytics_reports', reportId);
    
    if (!report) {
      throw new NotFoundError('Report not found');
    }

    if (report.created_by !== req.user.id) {
      throw new AuthorizationError('Access denied to this report');
    }

    res.json({
      success: true,
      data: {
        report: {
          id: report.id,
          name: report.name,
          description: report.description,
          filters: JSON.parse(report.filters),
          metrics: JSON.parse(report.metrics),
          group_by: report.group_by,
          chart_type: report.chart_type,
          data: JSON.parse(report.data),
          created_at: report.created_at,
          updated_at: report.updated_at
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

    console.error('Get report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch report',
      details: error.message
    });
  }
}));

// @route   PUT /api/v1/analytics/reports/:reportId
// @desc    Update an analytics report
// @access  Private
router.put('/reports/:reportId', authenticateToken, validateRequest(customReportSchema), asyncHandler(async (req, res) => {
  const { reportId } = req.params;
  const { name, description, filters, metrics, groupBy, chartType } = req.body;

  try {
    const report = await db.findById('analytics_reports', reportId);
    
    if (!report) {
      throw new NotFoundError('Report not found');
    }

    if (report.created_by !== req.user.id) {
      throw new AuthorizationError('Access denied to this report');
    }

    // Re-run the analytics query
    const { query, params } = buildAnalyticsQuery(filters, metrics, groupBy);
    const results = await db.query(query, params);

    // Update the report
    const updatedReport = await db.update('analytics_reports', reportId, {
      name,
      description,
      filters: JSON.stringify(filters),
      metrics: JSON.stringify(metrics),
      group_by: groupBy,
      chart_type: chartType,
      data: JSON.stringify(results.rows || results),
      updated_at: new Date()
    });

    res.json({
      success: true,
      data: {
        report: {
          id: updatedReport.id,
          name: updatedReport.name,
          description: updatedReport.description,
          chart_type: updatedReport.chart_type,
          updated_at: updatedReport.updated_at
        },
        results: results.rows || results
      },
      message: 'Report updated successfully'
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AuthorizationError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    console.error('Update report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update report',
      details: error.message
    });
  }
}));

// @route   DELETE /api/v1/analytics/reports/:reportId
// @desc    Delete an analytics report
// @access  Private
router.delete('/reports/:reportId', authenticateToken, asyncHandler(async (req, res) => {
  const { reportId } = req.params;

  try {
    const report = await db.findById('analytics_reports', reportId);
    
    if (!report) {
      throw new NotFoundError('Report not found');
    }

    if (report.created_by !== req.user.id) {
      throw new AuthorizationError('Access denied to this report');
    }

    await db.delete('analytics_reports', reportId);

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AuthorizationError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    console.error('Delete report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete report',
      details: error.message
    });
  }
}));

export default router;