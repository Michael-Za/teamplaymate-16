import winston from 'winston';
import jwt from 'jsonwebtoken';
import { createServer } from 'http';
import { Server } from 'socket.io';
import redisService from './redis.js';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/socket.log' })
  ]
});

class SocketService {
  constructor() {
    this.io = null;
    this.httpServer = null;
  }

  initialize(server) {
    try {
      this.io = new Server(server, {
        cors: {
          origin: process.env.FRONTEND_URL || 'http://localhost:3000',
          methods: ['GET', 'POST'],
        },
      });

      this.setupConnectionHandler();
      this.setupRedisSubscriber();

      console.log('Socket.IO initialized');
    } catch (error) {
      console.error('Error initializing Socket.IO:', error);
      throw error;
    }
  }

  setupConnectionHandler() {
    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      // Handle user joining a team room
      socket.on('joinTeam', (teamId) => {
        socket.join(`team-${teamId}`);
        console.log(`User ${socket.id} joined team ${teamId}`);
      });

      // Handle user leaving a team room
      socket.on('leaveTeam', (teamId) => {
        socket.leave(`team-${teamId}`);
        console.log(`User ${socket.id} left team ${teamId}`);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });
  }

  setupRedisSubscriber() {
    try {
      // Subscribe to Redis channels for real-time updates
      redisService.subscribe('chat:*', (channel, message) => {
        const teamId = channel.split(':')[1];
        this.io.to(`team-${teamId}`).emit('chatUpdate', JSON.parse(message));
      });

      redisService.subscribe('matches', (channel, message) => {
        this.io.emit('matchUpdate', JSON.parse(message));
      });

      redisService.subscribe('teams:*', (channel, message) => {
        const teamId = channel.split(':')[1];
        this.io.to(`team-${teamId}`).emit('teamUpdate', JSON.parse(message));
      });

      redisService.subscribe('players:*', (channel, message) => {
        const teamId = channel.split(':')[1];
        this.io.to(`team-${teamId}`).emit('playerUpdate', JSON.parse(message));
      });

      redisService.subscribe('events:*', (channel, message) => {
        const teamId = channel.split(':')[1];
        this.io.to(`team-${teamId}`).emit('eventUpdate', JSON.parse(message));
      });

      console.log('Redis subscriber setup complete');
    } catch (error) {
      console.error('Error setting up Redis subscriber:', error);
    }
  }

  // Emit event to specific team room
  emitToTeam(teamId, event, data) {
    if (this.io) {
      this.io.to(`team-${teamId}`).emit(event, data);
    }
  }

  // Emit event to all connected clients
  emitToAll(event, data) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  // Get Socket.IO instance
  getIO() {
    return this.io;
  }
}

export default SocketService;
