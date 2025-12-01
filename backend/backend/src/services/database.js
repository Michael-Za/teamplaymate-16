import { createClient } from '@supabase/supabase-js';
import winston from 'winston';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

class DatabaseService {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }

  async query(text, params) {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Executed query', { text, duration, rows: res.rowCount });
      return res;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  async findById(table, id) {
    try {
      const result = await this.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
      return result.rows[0];
    } catch (error) {
      console.error(`Error finding ${table} by ID:`, error);
      throw error;
    }
  }

  async findOne(table, conditions) {
    try {
      const keys = Object.keys(conditions);
      const values = Object.values(conditions);
      const whereClause = keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');
      const queryText = `SELECT * FROM ${table} WHERE ${whereClause} LIMIT 1`;
      
      const result = await this.query(queryText, values);
      return result.rows[0];
    } catch (error) {
      console.error(`Error finding ${table}:`, error);
      throw error;
    }
  }

  async findMany(table, conditions = {}, options = {}) {
    try {
      let queryText = `SELECT * FROM ${table}`;
      const values = [];
      
      if (Object.keys(conditions).length > 0) {
        const keys = Object.keys(conditions);
        values.push(...Object.values(conditions));
        const whereClause = keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');
        queryText += ` WHERE ${whereClause}`;
      }
      
      if (options.orderBy) {
        queryText += ` ORDER BY ${options.orderBy} ${options.ascending ? 'ASC' : 'DESC'}`;
      }
      
      if (options.limit) {
        values.push(options.limit);
        queryText += ` LIMIT $${values.length}`;
      }
      
      if (options.offset) {
        values.push(options.offset);
        queryText += ` OFFSET $${values.length}`;
      }
      
      const result = await this.query(queryText, values);
      return result.rows;
    } catch (error) {
      console.error(`Error finding ${table}s:`, error);
      throw error;
    }
  }

  async create(table, data) {
    try {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
      const queryText = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
      
      const result = await this.query(queryText, values);
      return result.rows[0];
    } catch (error) {
      console.error(`Error creating ${table}:`, error);
      throw error;
    }
  }

  async update(table, id, data) {
    try {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
      const queryText = `UPDATE ${table} SET ${setClause} WHERE id = $${values.length + 1} RETURNING *`;
      
      const result = await this.query(queryText, [...values, id]);
      return result.rows[0];
    } catch (error) {
      console.error(`Error updating ${table}:`, error);
      throw error;
    }
  }

  async delete(table, id) {
    try {
      const queryText = `DELETE FROM ${table} WHERE id = $1 RETURNING *`;
      const result = await this.query(queryText, [id]);
      return result.rows[0];
    } catch (error) {
      console.error(`Error deleting ${table}:`, error);
      throw error;
    }
  }

  async close() {
    await this.pool.end();
  }
}

// Mock database service for testing without Supabase
// This is a simplified version for demonstration purposes

// Using winston logger from top of file

// Mock in-memory database
const mockDatabase = {
  users: [],
  teams: [],
  players: [],
  matches: []
};

// Mock database service
class MockDatabaseService {
  constructor() {
    this.isConnected = true;
    console.info('Mock database service initialized');
  }

  // User operations
  async findMany(table, criteria) {
    try {
      const tableData = mockDatabase[table] || [];
      if (Object.keys(criteria).length === 0) {
        return tableData;
      }
      
      return tableData.filter(item => {
        return Object.keys(criteria).every(key => item[key] === criteria[key]);
      });
    } catch (error) {
      console.error(`Error finding records in ${table}: ${error.message}`);
      return [];
    }
  }

  async findOne(table, criteria) {
    try {
      const results = await this.findMany(table, criteria);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error(`Error finding record in ${table}: ${error.message}`);
      return null;
    }
  }

  async findById(table, id) {
    try {
      return await this.findOne(table, { id });
    } catch (error) {
      console.error(`Error finding record by ID in ${table}: ${error.message}`);
      return null;
    }
  }

  async create(table, data) {
    try {
      const tableData = mockDatabase[table] || [];
      const newItem = {
        id: `mock_${table}_${Date.now()}`,
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      tableData.push(newItem);
      mockDatabase[table] = tableData;
      
      console.info(`Created new record in ${table} with ID: ${newItem.id}`);
      return newItem;
    } catch (error) {
      console.error(`Error creating record in ${table}: ${error.message}`);
      throw error;
    }
  }

  async update(table, id, data) {
    try {
      const tableData = mockDatabase[table] || [];
      const index = tableData.findIndex(item => item.id === id);
      
      if (index === -1) {
        throw new Error(`Record with ID ${id} not found in ${table}`);
      }
      
      const updatedItem = {
        ...tableData[index],
        ...data,
        updated_at: new Date().toISOString()
      };
      
      tableData[index] = updatedItem;
      mockDatabase[table] = tableData;
      
      console.info(`Updated record in ${table} with ID: ${id}`);
      return updatedItem;
    } catch (error) {
      console.error(`Error updating record in ${table}: ${error.message}`);
      throw error;
    }
  }

  async delete(table, id) {
    try {
      const tableData = mockDatabase[table] || [];
      const filteredData = tableData.filter(item => item.id !== id);
      
      if (filteredData.length === tableData.length) {
        throw new Error(`Record with ID ${id} not found in ${table}`);
      }
      
      mockDatabase[table] = filteredData;
      console.info(`Deleted record from ${table} with ID: ${id}`);
      return { success: true };
    } catch (error) {
      console.error(`Error deleting record from ${table}: ${error.message}`);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    return {
      status: 'healthy',
      service: 'mock-database',
      timestamp: new Date().toISOString()
    };
  }
}

// Create instances
const mockDb = new MockDatabaseService();
const databaseServiceInstance = new DatabaseService();

// Export the main database service instance and mock service
export { MockDatabaseService, mockDb };
export default databaseServiceInstance;
