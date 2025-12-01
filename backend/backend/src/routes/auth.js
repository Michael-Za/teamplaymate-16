import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import Joi from 'joi';
import databaseService from '../services/database.js';
import redisService from '../services/redis.js';
import emailService from '../services/emailService.js';
import { 
  asyncHandler, 
  validateRequest, 
  ValidationError, 
  UnauthorizedError,
  ConflictError,
  NotFoundError
} from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const db = databaseService;
const redis = redisService;
// Use emailService instance directly instead of destructuring
const sendEmail = emailService.sendEmail.bind(emailService);

// Rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: 'Too many login attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 requests per windowMs
  message: {
    success: false,
    error: 'Too many registration attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation schemas
const registerSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    role: Joi.string().valid('player', 'coach', 'manager').required()
  })
});

const loginSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  })
});

const forgotPasswordSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required()
  })
});

const resetPasswordSchema = Joi.object({
  body: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(8).required()
  })
});

// Helper functions
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      teamId: user.team_id
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { 
      id: user.id, 
      email: user.email 
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Routes
// @route   POST /api/v1/auth/register
// @desc    Register user
// @access  Public
router.post('/register', registerLimiter, validateRequest(registerSchema), asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, role } = req.body;

  try {
    // Check if user already exists
    const existingUser = await db.findOne('users', { email });
    if (existingUser) {
      throw new ConflictError('User already exists with this email');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await db.create('users', {
      email,
      password: hashedPassword,
      first_name: firstName,
      last_name: lastName,
      role,
      is_verified: false,
      created_at: new Date(),
      updated_at: new Date()
    });

    // Generate verification token
    const verificationToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Store verification token in Redis with 24-hour expiration
    await redis.setex(`verification_token:${user.id}`, 24 * 60 * 60, verificationToken);

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Verify your email address',
      template: 'emailVerification',
      context: {
        firstName: user.first_name,
        verificationUrl
      }
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email to verify your account.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role
        }
      }
    });
  } catch (error) {
    if (error instanceof ConflictError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      details: error.message
    });
  }
}));

// @route   POST /api/v1/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginLimiter, validateRequest(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user
    const user = await db.findOne('users', { email });
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Check if user is verified
    if (!user.is_verified) {
      throw new UnauthorizedError('Please verify your email before logging in');
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Store refresh token in Redis with 7-day expiration
    await redis.setex(`refresh_token:${user.id}`, 7 * 24 * 60 * 60, refreshToken);

    // Update last login
    await db.update('users', user.id, {
      last_login: new Date(),
      updated_at: new Date()
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          teamId: user.team_id
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      details: error.message
    });
  }
}));

// @route   POST /api/v1/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new UnauthorizedError('Refresh token is required');
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Check if refresh token exists in Redis
    const storedToken = await redis.get(`refresh_token:${decoded.id}`);
    if (!storedToken || storedToken !== refreshToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Find user
    const user = await db.findById('users', decoded.id);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    // Store new refresh token in Redis
    await redis.setex(`refresh_token:${user.id}`, 7 * 24 * 60 * 60, newRefreshToken);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }

    if (error instanceof UnauthorizedError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Token refresh failed',
      details: error.message
    });
  }
}));

// @route   POST /api/v1/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authenticateToken, asyncHandler(async (req, res) => {
  try {
    // Remove refresh token from Redis
    await redis.del(`refresh_token:${req.user.id}`);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      details: error.message
    });
  }
}));

// @route   POST /api/v1/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', validateRequest(forgotPasswordSchema), asyncHandler(async (req, res) => {
  const { email } = req.body;

  try {
    // Find user
    const user = await db.findOne('users', { email });
    if (!user) {
      // Don't reveal if user exists or not
      return res.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.'
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_RESET_SECRET,
      { expiresIn: '1h' }
    );

    // Store reset token in Redis with 1-hour expiration
    await redis.setex(`reset_token:${user.id}`, 60 * 60, resetToken);

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      template: 'passwordReset',
      context: {
        firstName: user.first_name,
        resetUrl
      }
    });

    res.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'Password reset request failed',
      details: error.message
    });
  }
}));

// @route   POST /api/v1/auth/reset-password
// @desc    Reset password
// @access  Public
router.post('/reset-password', validateRequest(resetPasswordSchema), asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  try {
    // Verify reset token
    const decoded = jwt.verify(token, process.env.JWT_RESET_SECRET);

    // Check if reset token exists in Redis
    const storedToken = await redis.get(`reset_token:${decoded.userId}`);
    if (!storedToken || storedToken !== token) {
      throw new UnauthorizedError('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update user password
    await db.update('users', decoded.userId, {
      password: hashedPassword,
      updated_at: new Date()
    });

    // Remove reset token from Redis
    await redis.del(`reset_token:${decoded.userId}`);

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }

    if (error instanceof UnauthorizedError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Password reset failed',
      details: error.message
    });
  }
}));

// @route   GET /api/v1/auth/verify-email
// @desc    Verify email address
// @access  Public
router.get('/verify-email', asyncHandler(async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({
      success: false,
      error: 'Verification token is required'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if verification token exists in Redis
    const storedToken = await redis.get(`verification_token:${decoded.userId}`);
    if (!storedToken || storedToken !== token) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification token'
      });
    }

    // Update user verification status
    await db.update('users', decoded.userId, {
      is_verified: true,
      updated_at: new Date()
    });

    // Remove verification token from Redis
    await redis.del(`verification_token:${decoded.userId}`);

    res.json({
      success: true,
      message: 'Email verified successfully. You can now log in.'
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification token'
      });
    }

    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Email verification failed',
      details: error.message
    });
  }
}));

export default router;