import express from 'express';
import Groq from 'groq-sdk'; // This is why we added the package above
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Initialize Groq
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY 
});

router.post('/message', authenticateToken, async (req, res) => {
    try {
        const { message } = req.body;
        
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: message }],
            model: 'mixtral-8x7b-32768', // Or 'llama3-70b-8192'
        });

        res.json({ response: completion.choices[0]?.message?.content || "" });
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ error: 'AI Assistant failed to respond' });
    }
});

export default router;