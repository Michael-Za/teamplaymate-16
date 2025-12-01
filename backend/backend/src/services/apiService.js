import databaseService from './database.js';
import redisService from './redis.js';
import emailService from './emailService.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import axios from 'axios';

class ApiService {
  constructor() {
    this.client = axios.create({
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async get(url, config = {}) {
    try {
      const response = await this.client.get(url, config);
      return response.data;
    } catch (error) {
      console.error(`API GET error for ${url}:`, error.message);
      throw error;
    }
  }

  async post(url, data, config = {}) {
    try {
      const response = await this.client.post(url, data, config);
      return response.data;
    } catch (error) {
      console.error(`API POST error for ${url}:`, error.message);
      throw error;
    }
  }

  async put(url, data, config = {}) {
    try {
      const response = await this.client.put(url, data, config);
      return response.data;
    } catch (error) {
      console.error(`API PUT error for ${url}:`, error.message);
      throw error;
    }
  }

  async delete(url, config = {}) {
    try {
      const response = await this.client.delete(url, config);
      return response.data;
    } catch (error) {
      console.error(`API DELETE error for ${url}:`, error.message);
      throw error;
    }
  }
}

export default new ApiService();
