const { SecurityService } = require('./securityService');
const logger = require('../utils/logger');

class BackgroundSecurityMonitor {
  constructor() {
    this.securityService = new SecurityService();
    this.isRunning = false;
    this.monitoringInterval = null;
    this.cleanupInterval = null;
  }

  async start() {
    if (this.isRunning) {
      return;
    }

    try {
      this.isRunning = true;
      this.monitoringInterval = setInterval(() => this.performSecurityCheck(), 5 * 60 * 1000);
      this.cleanupInterval = setInterval(() => this.performCleanup(), 60 * 60 * 1000);

      await this.performSecurityCheck();

      if (process.env.NODE_ENV === 'development') {
        logger.info('[SYSTEM] Background security monitor started');
      }
    } catch (error) {
      logger.error('[SYSTEM] Failed to start security monitor:', error);
      this.isRunning = false;
    }
  }

  async stop() {
    if (!this.isRunning) {
      return;
    }
    this.isRunning = false;
    if (this.monitoringInterval) clearInterval(this.monitoringInterval);
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);

    if (process.env.NODE_ENV === 'development') {
      logger.info('[SYSTEM] Background security monitor stopped');
    }
  }

  async performSecurityCheck() {
    try {
      const stats = await this.securityService.getSecurityStats();

      if (stats.threatsLastHour > 10) {
        logger.error('[SYSTEM] High number of security threats detected in the last hour', { count: stats.threatsLastHour });
      }

      await this.cleanupExpiredBlacklists();
      await this.cleanupOldFailedAttempts();

    } catch (error) {
      logger.error('[SYSTEM] Security check failed:', error);
    }
  }

  async performCleanup() {
    try {
      const redis = this.securityService.redis;
      await redis.ltrim('_sys_security_events', 0, 999);
      
      const rateLimitKeys = await redis.keys('req_count:*');
      for (const key of rateLimitKeys) {
        const ttl = await redis.ttl(key);
        if (ttl <= 0) await redis.del(key);
      }
      
      const lockoutKeys = await redis.keys('lockout:*');
      for (const key of lockoutKeys) {
        const ttl = await redis.ttl(key);
        if (ttl <= 0) await redis.del(key);
      }
      
    } catch (error) {
      logger.error('[SYSTEM] Cleanup failed:', error);
    }
  }

  async cleanupExpiredBlacklists() {
    try {
      const redis = this.securityService.redis;
      const blacklistKeys = await redis.keys('blacklist:*');
      for (const key of blacklistKeys) {
        const ttl = await redis.ttl(key);
        if (ttl <= 0) await redis.del(key);
      }
    } catch (error) {
      logger.error('[SYSTEM] Blacklist cleanup failed:', error);
    }
  }

  async cleanupOldFailedAttempts() {
    try {
      const redis = this.securityService.redis;
      const failedAttemptKeys = await redis.keys('failed_attempts:*');
      for (const key of failedAttemptKeys) {
        const ttl = await redis.ttl(key);
        if (ttl <= 0) await redis.del(key);
      }
    } catch (error) {
      logger.error('[SYSTEM] Failed attempts cleanup failed:', error);
    }
  }

  async getStatus() {
    if (!this.isRunning) {
      return { active: false, message: 'Security monitor not running' };
    }
    try {
      const stats = await this.securityService.getSecurityStats();
      return { active: true, ...stats };
    } catch (error) {
      return { active: true, healthy: false, error: error.message };
    }
  }

  async emergencyShutdown() {
    logger.error('[SYSTEM] Emergency security shutdown initiated');
    await this.stop();
  }
}

const backgroundSecurityMonitor = new BackgroundSecurityMonitor();

process.nextTick(() => backgroundSecurityMonitor.start());

process.on('SIGTERM', () => backgroundSecurityMonitor.stop());
process.on('SIGINT', () => backgroundSecurityMonitor.stop());

module.exports = backgroundSecurityMonitor;
