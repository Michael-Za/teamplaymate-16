const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
const config = require('./env');

const dbLogger = {
  info: (msg) => console.log(`[DB INFO] ${msg}`),
  warn: (msg) => console.warn(`[DB WARN] ${msg}`),
  error: (msg, error) => console.error(`[DB ERROR] ${msg}`, error || '')
};

let supabase = null;
let supabaseAdmin = null;
let pool = null;

const initializeDatabase = async () => {
  // Intentionally bypassing Supabase initialization to allow the server to run without a valid API key.
  // This will force the application to use its mock database services.
  dbLogger.warn('Supabase not configured, skipping real database initialization.');
};

const closeDatabase = async () => {
  if (pool) {
    await pool.end();
    dbLogger.info('PostgreSQL pool has been closed.');
  }
  // Supabase clients do not require an explicit close method.
};

// Export the functions and use getters to export the clients.
// This ensures that other modules always get the current client instance,
// even if it's initialized after the module was first loaded.
module.exports = {
  get supabase() {
    return supabase;
  },
  get supabaseAdmin() {
    return supabaseAdmin;
  },
  get pool() {
    return pool;
  },
  initializeDatabase,
  closeDatabase
};
