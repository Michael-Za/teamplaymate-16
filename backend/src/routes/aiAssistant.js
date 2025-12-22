const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const GroqService = require('../services/groqService');

const router = express.Router();
const groqService = new GroqService();

// @route   POST /api/v1/ai-assistant/chat
// @desc    Send message to AI assistant
// @access  Public
router.post('/chat', asyncHandler(async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({
      success: false,
      error: 'Message is required',
    });
  }

  try {
    const response = await groqService.generateChatResponse(message);
    res.json({
      success: true,
      data: {
        response,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('AI Assistant error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to generate response from AI assistant',
      details: error.message,
    });
  }
}));

module.exports = router;
