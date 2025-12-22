import winston from 'winston';
import jwt from 'jsonwebtoken';
import { createServer } from 'http';
import { Server } from 'socket.io';

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

export default new SocketService();
