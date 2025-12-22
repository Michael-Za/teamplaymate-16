const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const Joi = require('joi');

// Load environment variables
dotenv.config();

const { setupErrorHandler } = require('./middleware/errorHandler');
const logger = require('./services/logger');
const redisService = require('./services/redis');
const databaseService = require('./services/database');
const securityService = require('./services/securityService');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/players');
const teamRoutes = require('./routes/teams');
const gameRoutes = require('./routes/matches');
const statsRoutes = require('./routes/analytics');
const notificationRoutes = require('./routes/notifications');
const subscriptionRoutes = require('./routes/subscriptions');
const aiChatRoutes = require('./routes/aiChat');

async function initializeApp() {
    logger.info('Step 1: Initializing services...', { service: 'StatSor Backend' });

    // ... (database, redis, security initializations)

    const app = express();
    const server = http.createServer(app);
    const io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:3008",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    app.use(helmet());
    app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3008', credentials: true }));
    app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

    const apiLimiter = require('./middleware/rateLimiter');
    app.use('/api/', apiLimiter);

    logger.info('Step 2: Configuring middleware...', { service: 'StatSor Backend' });

    logger.info('Step 3: Setting up routes...', { service: 'StatSor Backend' });
    app.use('/api/v1/auth', authRoutes);
    // app.use('/api/v1/users', userRoutes);
    app.use('/api/v1/teams', teamRoutes);
    // Correctly pass the io instance to the gameRoutes module
    app.use('/api/v1/games', gameRoutes(io));
    app.use('/api/v1/stats', statsRoutes);
    app.use('/api/v1/notifications', notificationRoutes(io));
    app.use('/api/v1/subscriptions', subscriptionRoutes);
    app.use('/api/v1/ai', aiChatRoutes);

    app.get('/health', (req, res) => res.status(200).json({ status: 'UP' }));

    logger.info('Step 4: Setting up error handling...', { service: 'StatSor Backend' });
    setupErrorHandler(app);

    logger.info('Step 5: Initializing Socket.io...', { service: 'StatSor Backend' });
    require('./sockets/gameSockets')(io);

    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
        logger.info(`🚀 Server running on port ${PORT}`, { service: 'StatSor Backend' });
    });

    return { app, server, io };
}

if (require.main === module) {
    initializeApp().catch(err => {
        logger.error('Failed to initialize application', { error: err });
        process.exit(1);
    });
}

module.exports = initializeApp;
