import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: join(__dirname, '../../.env') });

// Environment configuration
const envConfig = {
  // Server configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  HOST: process.env.HOST || 'localhost',

  // Database configuration
  DATABASE_URL: process.env.DATABASE_URL,

  // JWT configuration
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_RESET_SECRET: process.env.JWT_RESET_SECRET,

  // Redis configuration
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  // Email configuration
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM,

  // Frontend URL
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Groq API
  GROQ_API_KEY: process.env.GROQ_API_KEY,

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_RESET_SECRET',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.warn('Missing required environment variables:', missingEnvVars);
}

export default envConfig;
