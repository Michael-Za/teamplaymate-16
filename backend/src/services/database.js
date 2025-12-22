const { createClient } = require('@supabase/supabase-js');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

class DatabaseService {
  constructor() {
    this.supabase = null;
    this.isConnected = false;
  }

  async initialize() {
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('your-')) {
        logger.warn('Supabase not configured properly. Running in a disconnected state.');
        this.isConnected = false;
        return;
      }

      this.supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      });

      // Test connection
      const { data, error } = await this.supabase.from('players').select('id').limit(1);

      if (error && error.code !== 'PGRST116') { // PGRST116 means table not found, which is ok
        throw error;
      }

      this.isConnected = true;
      logger.info('Database service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database service:', error);
      this.isConnected = false;
      throw error;
    }
  }

  getClient() {
    if (!this.supabase) {
      throw new Error('Database service is not initialized.');
    }
    return this.supabase;
  }

  isHealthy() {
    return this.isConnected;
  }

  async setRefreshToken(userId, refreshToken) {
    const { error } = await this.supabase
      .from('refresh_tokens')
      .insert({ user_id: userId, token: refreshToken });
    if (error) throw error;
  }

  async getRefreshToken(userId) {
    const { data, error } = await this.supabase
      .from('refresh_tokens')
      .select('token')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);
    if (error) throw error;
    return data.length > 0 ? data[0].token : null;
  }

  async deleteRefreshToken(userId, refreshToken) {
    const { error } = await this.supabase
      .from('refresh_tokens')
      .delete()
      .match({ user_id: userId, token: refreshToken });
    if (error) throw error;
  }

  async deleteAllRefreshTokens(userId) {
    const { error } = await this.supabase
      .from('refresh_tokens')
      .delete()
      .eq('user_id', userId);
    if (error) throw error;
  }

  async blacklistToken(token) {
    const { error } = await this.supabase
      .from('token_blacklist')
      .insert({ token });
    if (error) throw error;
  }

  async isTokenBlacklisted(token) {
    const { data, error } = await this.supabase
      .from('token_blacklist')
      .select('token')
      .eq('token', token);
    if (error) throw error;
    return data.length > 0;
  }
}

const databaseServiceInstance = new DatabaseService();

module.exports = databaseServiceInstance;
