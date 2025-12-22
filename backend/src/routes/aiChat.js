const express = require('express');
// const { Groq } = require('groq-sdk'); // Temporarily disabled
const AiChatHistoryService = require('../services/aiChatHistoryService.js');
const { asyncHandler } = require('../middleware/errorHandler.js');
const { authenticateToken } = require('../middleware/auth.js');
// const { config } = require('../config/env.js'); // config is not used

const router = express.Router();
const chatHistoryService = new AiChatHistoryService();

// Initialize Groq client - COMMENTED OUT
/*
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});
*/
const groq = null; // Set to null to avoid runtime errors

const handleAIError = (res, message = 'AI chat service is currently disabled.') => {
    console.warn(message);
    return res.status(501).json({ error: message });
}

// @route   POST /api/v1/aichatproxy/chat
// @desc    Get an AI response and save the chat message
// @access  Private
router.post(
  '/chat',
  authenticateToken,
  asyncHandler(async (req, res) => {
    if (!groq) return handleAIError(res);
    // Original logic would be here
    res.json({ message: "This endpoint is temporarily disabled." });
  })
);

// @route   GET /api/v1/aichat/history
// @desc    Get the user's chat history
// @access  Private
router.get(
  '/history',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const history = await chatHistoryService.getHistory(userId);
    res.json({
      history,
    });
  })
);

module.exports = router;
