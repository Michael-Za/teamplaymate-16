import jwt from 'jsonwebtoken';
import databaseService from '../services/database.js';
import { UnauthorizedError, ForbiddenError } from './errorHandler.js';

const db = databaseService;

// Middleware to authenticate token
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new UnauthorizedError('Access token required');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db.findById('users', decoded.id);

    if (!user) {
      throw new UnauthorizedError('Invalid token');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    if (error instanceof UnauthorizedError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      details: error.message
    });
  }
};

// Middleware to require specific roles
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const userRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!userRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Middleware to require team ownership
export const requireTeamOwnership = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    // Extract teamId from params or body
    const teamId = req.params.teamId || req.body.teamId;
    
    if (!teamId) {
      throw new ForbiddenError('Team ID required');
    }

    const team = await db.findById('teams', teamId);
    
    if (!team) {
      throw new ForbiddenError('Team not found');
    }

    if (team.owner_id !== req.user.id && req.user.role !== 'admin') {
      throw new ForbiddenError('Access denied to this team');
    }

    req.team = team;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    console.error('Team ownership check error:', error);
    res.status(500).json({
      success: false,
      error: 'Team ownership check failed',
      details: error.message
    });
  }
};

// Middleware to require team membership
export const requireTeamMembership = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    // Extract teamId from params or body
    const teamId = req.params.teamId || req.body.teamId;
    
    if (!teamId) {
      throw new ForbiddenError('Team ID required');
    }

    // Check if user is a member of the team
    const membership = await db.findOne('team_memberships', {
      team_id: teamId,
      user_id: req.user.id,
      status: 'active'
    });

    if (!membership && req.user.role !== 'admin') {
      throw new ForbiddenError('Access denied to this team');
    }

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    console.error('Team membership check error:', error);
    res.status(500).json({
      success: false,
      error: 'Team membership check failed',
      details: error.message
    });
  }
};

// Middleware to require active subscription
export const requireSubscription = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    // Check if user has an active subscription
    const subscription = await db.findOne('subscriptions', {
      user_id: req.user.id,
      status: 'active'
    });

    if (!subscription) {
      throw new ForbiddenError('Active subscription required');
    }

    // Check if subscription is expired
    if (subscription.expires_at && new Date(subscription.expires_at) < new Date()) {
      throw new ForbiddenError('Subscription has expired');
    }

    req.subscription = subscription;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    console.error('Subscription check error:', error);
    res.status(500).json({
      success: false,
      error: 'Subscription check failed',
      details: error.message
    });
  }
};
