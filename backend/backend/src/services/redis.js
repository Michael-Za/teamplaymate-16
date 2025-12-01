import winston from 'winston';
import config from '../config/env.js';
import { createClient } from 'redis';

class RedisService {
  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error', err);
    });

    this.connect();
  }

  async connect() {
    try {
      await this.client.connect();
      console.log('Connected to Redis');
    } catch (error) {
      console.error('Error connecting to Redis:', error);
    }
  }

  async set(key, value) {
    try {
      await this.client.set(key, value);
    } catch (error) {
      console.error('Error setting Redis key:', error);
      throw error;
    }
  }

  async setex(key, expiry, value) {
    try {
      await this.client.setEx(key, expiry, value);
    } catch (error) {
      console.error('Error setting Redis key with expiry:', error);
      throw error;
    }
  }

  async get(key) {
    try {
      return await this.client.get(key);
    } catch (error) {
      console.error('Error getting Redis key:', error);
      throw error;
    }
  }

  async del(key) {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Error deleting Redis key:', error);
      throw error;
    }
  }

  async publish(channel, message) {
    try {
      await this.client.publish(channel, message);
    } catch (error) {
      console.error('Error publishing to Redis channel:', error);
      throw error;
    }
  }

  async subscribe(channel, callback) {
    try {
      await this.client.subscribe(channel, callback);
    } catch (error) {
      console.error('Error subscribing to Redis channel:', error);
      throw error;
    }
  }

  async quit() {
    try {
      await this.client.quit();
    } catch (error) {
      console.error('Error closing Redis connection:', error);
      throw error;
    }
  }

  isConnected() {
    return this.client.isOpen;
  }
}

export default new RedisService();
export { RedisService };
