const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler.js');
const { authenticateToken } = require('../middleware/auth.js');
const GroqService = require('../services/groqService.js');

const router = express.Router();
const groqService = new GroqService();

// Route to handle chat requests directly using GroqService
router.post(
  '/chat',
  authenticateToken,
  asyncHandler(async (req, res) => {
    try {
      const { message, context } = req.body;
      const userId = req.user.id;

      const fullContext = {
        userId,
        ...context
      };

      const aiResponse = await groqService.generateChatResponse(message, fullContext);

      res.json({
        success: true,
        data: {
          response: aiResponse
        }
      });

    } catch (error) {
      console.error('Error processing AI chat request:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process AI chat request',
        details: error.message
      });
    }
  })
);

module.exports = router;
