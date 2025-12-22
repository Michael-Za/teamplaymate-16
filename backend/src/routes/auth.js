const express = require('express');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const databaseService = require('../services/database');
const redisService = require('../services/redis');
const emailService = require('../services/email');
const SecurityService = require('../services/securityService');
const logger = require('../services/logger');
const { asyncHandler, validateRequest, ValidationError, NotFoundError, AuthorizationError } = require('../middleware/errorHandler');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const db = databaseService;

// --- Passport.js Google Strategy ---
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/v1/auth/google/callback'
  },
  asyncHandler(async (accessToken, refreshToken, profile, done) => {
    const { id, displayName, emails, photos } = profile;
    const email = emails[0].value;
    const existingUser = await db.findOne('users', { email });

    if (existingUser) {
      // If user exists, update google_id if it's not there and log them in.
      if (!existingUser.google_id) {
        await db.update('users', existingUser.id, { google_id: id });
      }
      return done(null, existingUser);
    } else {
      // If user does not exist, create a new user.
      const [firstName, ...lastNameParts] = displayName.split(' ');
      const newUser = await db.create('users', {
        google_id: id,
        email,
        first_name: firstName,
        last_name: lastNameParts.join(' ') || '',
        avatar_url: photos[0].value,
        email_verified: true, // Email is verified by Google
        status: 'active'
      });
      return done(null, newUser);
    }
  })
));

// --- Validation Schemas ---
const registerSchema = Joi.object({
    body: Joi.object({
        firstName: Joi.string().min(2).max(50).required(),
        lastName: Joi.string().min(2).max(50).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(8).required(),
        teamCode: Joi.string().optional().allow('')
    })
});

const loginSchema = Joi.object({
    body: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    })
});

const passwordResetRequestSchema = Joi.object({
    body: Joi.object({
        email: Joi.string().email().required()
    })
});

const passwordResetSchema = Joi.object({
    body: Joi.object({
        token: Joi.string().required(),
        password: Joi.string().min(8).required()
    })
});

// --- Helper Functions ---
const generateTokens = async (user) => {
    const payload = {
        id: user.id,
        role: user.role,
        team_id: user.team_id,
        permissions: user.permissions || []
    };
    const accessToken = SecurityService.generateAccessToken(payload);
    const refreshToken = SecurityService.generateRefreshToken(payload);

    // Store refresh token in Redis
    await redisService.setex(`refresh_token:${user.id}`, process.env.REFRESH_TOKEN_EXPIRATION_SECONDS, refreshToken);

    return { accessToken, refreshToken };
};


// --- Routes ---

// @route   POST /api/v1/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateRequest(registerSchema), asyncHandler(async (req, res) => {
    const { firstName, lastName, email, password, teamCode } = req.body;

    let existingUser = await db.findOne('users', { email });
    if (existingUser) {
        throw new ValidationError('User with this email already exists.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let teamId = null;

    if (teamCode) {
        const team = await db.findOne('teams', { code: teamCode });
        if (team) {
            teamId = team.id;
        } else {
            logger.warn(`Invalid team code used during registration: ${teamCode}`, { email });
        }
    }

    const newUser = await db.create('users', {
        first_name: firstName,
        last_name: lastName,
        email,
        password_hash: hashedPassword,
        team_id: teamId,
        role: teamId ? 'player' : 'user', // Assign role based on team joining
    });

    // Don't generate tokens until email is verified
    const verificationToken = crypto.randomBytes(32).toString('hex');
    await db.create('email_verifications', {
      user_id: newUser.id,
      token: verificationToken,
      expires_at: new Date(Date.now() + 3600000) // 1 hour
    });

    await emailService.sendEmailVerification(email, verificationToken);

    res.status(201).json({ message: 'Registration successful. Please check your email to verify your account.' });
}));


// @route   POST /api/v1/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateRequest(loginSchema), asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await db.findOne('users', { email });
    if (!user) {
        throw new AuthorizationError('Invalid credentials.');
    }

    if (!user.password_hash) {
      throw new AuthorizationError('Please log in using your social account or reset your password.');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
        throw new AuthorizationError('Invalid credentials.');
    }
    
    if (!user.email_verified) {
      throw new AuthorizationError('Please verify your email before logging in.');
    }
    
    if(user.status !== 'active') {
      throw new AuthorizationError('Your account is inactive. Please contact support.');
    }

    const { accessToken, refreshToken } = await generateTokens(user);

    res.json({
        message: 'Login successful',
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            role: user.role,
            teamId: user.team_id,
            avatarUrl: user.avatar_url
        }
    });
}));

// @route   GET /api/v1/auth/google
// @desc    Authenticate with Google
// @access  Public
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

// @route   GET /api/v1/auth/google/callback
// @desc    Google auth callback
// @access  Public
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login', session: false }), asyncHandler(async (req, res) => {
    // Successful authentication, user object is attached to req
    const user = req.user;
    const { accessToken, refreshToken } = await generateTokens(user);

    // Redirect to frontend with tokens
    const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`;
    res.redirect(redirectUrl);
}));


// @route   POST /api/v1/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authenticateToken, asyncHandler(async (req, res) => {
    const userId = req.user.id;
    await redisService.del(`refresh_token:${userId}`);
    res.status(200).json({ message: 'Logged out successfully.' });
}));


// @route   POST /api/v1/auth/refresh-token
// @desc    Refresh access token
// @access  Public
router.post('/refresh-token', asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        throw new AuthorizationError('Refresh token not provided.');
    }

    const decoded = SecurityService.verifyRefreshToken(refreshToken);
    const storedToken = await redisService.get(`refresh_token:${decoded.id}`);

    if (refreshToken !== storedToken) {
        // If tokens don't match, it could be a sign of a compromised token.
        // For enhanced security, delete the stored token to force a re-login.
        await redisService.del(`refresh_token:${decoded.id}`);
        throw new AuthorizationError('Invalid refresh token.');
    }

    const user = await db.findById('users', decoded.id);
    if (!user) {
        throw new AuthorizationError('User not found.');
    }

    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(user);

    res.json({ accessToken, refreshToken: newRefreshToken });
}));

// @route   GET /api/v1/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
    const user = await db.query(`
        SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.avatar_url, u.team_id, t.name as team_name
        FROM users u
        LEFT JOIN teams t ON u.team_id = t.id
        WHERE u.id = $1
    `, [req.user.id]);

    if (!user || user.length === 0) {
        throw new NotFoundError('User not found.');
    }

    res.json(user[0]);
}));

// @route   POST /api/v1/auth/request-password-reset
// @desc    Request password reset email
// @access  Public
router.post('/request-password-reset', validateRequest(passwordResetRequestSchema), asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await db.findOne('users', { email });

    if (user) {
        const token = crypto.randomBytes(32).toString('hex');
        const expires_at = new Date(Date.now() + 3600000); // 1 hour

        await db.create('password_resets', { user_id: user.id, token, expires_at });
        await emailService.sendPasswordResetEmail(email, token);
    }
    
    // Always return a success message to prevent user enumeration
    res.json({ message: 'If a user with that email exists, a password reset link has been sent.' });
}));


// @route   POST /api/v1/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', validateRequest(passwordResetSchema), asyncHandler(async (req, res) => {
    const { token, password } = req.body;

    const resetRequest = await db.findOne('password_resets', { token });
    if (!resetRequest || new Date() > new Date(resetRequest.expires_at)) {
        throw new AuthorizationError('Invalid or expired password reset token.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.update('users', resetRequest.user_id, { password_hash: hashedPassword });

    // Invalidate the token after use
    await db.delete('password_resets', resetRequest.id);

    res.json({ message: 'Password has been reset successfully.' });
}));

// @route   GET /api/v1/auth/verify-email
// @desc    Verify user's email address
// @access  Public
router.get('/verify-email', asyncHandler(async(req, res) => {
    const { token } = req.query;
    if(!token) {
        throw new ValidationError('Verification token is missing.');
    }

    const verification = await db.findOne('email_verifications', { token });
    if(!verification || new Date() > new Date(verification.expires_at)) {
        throw new AuthorizationError('Invalid or expired email verification token.');
    }

    await db.update('users', verification.user_id, { email_verified: true, status: 'active' });
    await db.delete('email_verifications', verification.id);

    res.send('Email verified successfully. You can now log in.');
}));


module.exports = router;
