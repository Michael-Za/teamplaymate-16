const logger = require('../services/logger');

module.exports = (io) => {
  io.on('connection', (socket) => {
    logger.info(`New client connected: ${socket.id}`)

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });
};