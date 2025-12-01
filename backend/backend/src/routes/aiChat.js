import express from 'express';
import AiChatHistoryService from '../services/aiChatHistoryService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const chatHistoryService = new AiChatHistoryService();

// @route   POST /api/v1/aichat/messages
// @desc    Save a chat message and its response
// @access  Private
router.post(
  '/messages',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { message, response, context } = req.body;
    const userId = req.user.id;

    const savedMessage = await chatHistoryService.addMessage(userId, message, response, context);

    res.status(201).json({
      message: 'Message saved successfully',
      data: savedMessage,
    });
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

export default router;