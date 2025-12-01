import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';
import fetch from 'node-fetch';
import config from '../config/env.js';

const router = express.Router();

// Proxy route to the Python AI chatbot
router.post(
  '/chat',
  authenticateToken,
  asyncHandler(async (req, res) => {
    try {
      const { message, context } = req.body;
      const userId = req.user.id;

      // Get AI assistant backend URL from environment variables
      const aiAssistantUrl = config.AI_ASSISTANT_BACKEND_URL || 'http://localhost:5000';
      
      // Forward the request to the Python AI assistant backend
      const response = await fetch(`${aiAssistantUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context: {
            userId,
            ...context
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        res.json({
          success: true,
          data: data
        });
      } else {
        const errorData = await response.json();
        res.status(response.status).json({
          success: false,
          error: errorData.error || 'AI assistant backend error'
        });
      }
    } catch (error) {
      console.error('Error connecting to AI assistant backend:', error);
      res.status(503).json({
        success: false,
        error: 'Failed to connect to AI assistant backend',
        details: error.message
      });
    }
  })
);

// Get team data for the AI assistant
router.get(
  '/team-data',
  authenticateToken,
  asyncHandler(async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Get AI assistant backend URL from environment variables
      const aiAssistantUrl = config.AI_ASSISTANT_BACKEND_URL || 'http://localhost:5000';
      
      // Forward the request to the Python AI assistant backend
      const response = await fetch(`${aiAssistantUrl}/api/team-data`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        res.json({
          success: true,
          data: data
        });
      } else {
        const errorData = await response.json();
        res.status(response.status).json({
          success: false,
          error: errorData.error || 'AI assistant backend error'
        });
      }
    } catch (error) {
      console.error('Error connecting to AI assistant backend:', error);
      res.status(503).json({
        success: false,
        error: 'Failed to connect to AI assistant backend',
        details: error.message
      });
    }
  })
);

// Update team data for the AI assistant
router.post(
  '/team-data',
  authenticateToken,
  asyncHandler(async (req, res) => {
    try {
      const { teamData } = req.body;
      
      // Get AI assistant backend URL from environment variables
      const aiAssistantUrl = config.AI_ASSISTANT_BACKEND_URL || 'http://localhost:5000';
      
      // Forward the request to the Python AI assistant backend
      const response = await fetch(`${aiAssistantUrl}/api/team-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teamData)
      });

      if (response.ok) {
        const data = await response.json();
        res.json({
          success: true,
          data: data
        });
      } else {
        const errorData = await response.json();
        res.status(response.status).json({
          success: false,
          error: errorData.error || 'AI assistant backend error'
        });
      }
    } catch (error) {
      console.error('Error connecting to AI assistant backend:', error);
      res.status(503).json({
        success: false,
        error: 'Failed to connect to AI assistant backend',
        details: error.message
      });
    }
  })
);

export default router;