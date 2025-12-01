import winston from 'winston';
import Joi from 'joi';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' })
  ]
});

// Custom error classes
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message) {
    super(message || 'Validation failed', 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message) {
    super(message || 'Unauthorized access', 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message) {
    super(message || 'Access forbidden', 403);
  }
}

export class AuthorizationError extends AppError {
  constructor(message) {
    super(message || 'Access unauthorized', 401);
  }
}

export class NotFoundError extends AppError {
  constructor(message) {
    super(message || 'Resource not found', 404);
  }
}

export class ConflictError extends AppError {
  constructor(message) {
    super(message || 'Resource conflict', 409);
  }
}

export class PaymentError extends AppError {
  constructor(message) {
    super(message || 'Payment processing error', 402);
  }
}

// Async handler wrapper
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Validation middleware
export const validateRequest = (schema) => {
  return (req, res, next) => {
    // Validate request body
    if (schema.body) {
      const { error } = schema.body.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.details.map(detail => detail.message)
        });
      }
    }

    // Validate request query
    if (schema.query) {
      const { error } = schema.query.validate(req.query);
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.details.map(detail => detail.message)
        });
      }
    }

    // Validate request params
    if (schema.params) {
      const { error } = schema.params.validate(req.params);
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.details.map(detail => detail.message)
        });
      }
    }

    next();
  };
};

// Global error handler
export const globalErrorHandler = (err, req, res, next) => {
  console.error('Global error handler:', err);

  // Handle Joi validation errors
  if (err instanceof Joi.ValidationError) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.details.map(detail => detail.message)
    });
  }

  // Handle our custom errors
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message
    });
  }

  // Handle unexpected errors
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
};

// Error response formatter
const formatErrorResponse = (error, req) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const baseResponse = {
    error: {
      message: error.message,
      status: error.statusCode || 500,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method
    }
  };

  // Add additional error details in development
  if (isDevelopment) {
    baseResponse.error.stack = error.stack;
    baseResponse.error.name = error.name;
  }

  // Add validation errors if present
  if (error instanceof ValidationError && error.errors) {
    baseResponse.error.validation_errors = error.errors;
  }

  // Add request ID if available
  if (req.id) {
    baseResponse.error.request_id = req.id;
  }

  return baseResponse;
};

// Main error handler middleware
export const errorHandler = (error, req, res, next) => {
  // If response was already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(error);
  }

  let processedError = error;

  // Handle specific error types
  if (error.name === 'ValidationError') {
    processedError = new ValidationError(
      'Validation failed',
      Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }))
    );
  } else if (error.name === 'CastError') {
    processedError = new ValidationError(
      `Invalid ${error.path}: ${error.value}`
    );
  } else if (error.code === 11000) {
    // MongoDB duplicate key error
    const field = Object.keys(error.keyValue)[0];
    processedError = new ConflictError(
      `${field} already exists`
    );
  } else if (error.name === 'JsonWebTokenError') {
    processedError = new AuthenticationError('Invalid token');
  } else if (error.name === 'TokenExpiredError') {
    processedError = new AuthenticationError('Token expired');
  } else if (error.name === 'MulterError') {
    if (error.code === 'LIMIT_FILE_SIZE') {
      processedError = new ValidationError('File too large');
    } else if (error.code === 'LIMIT_FILE_COUNT') {
      processedError = new ValidationError('Too many files');
    } else {
      processedError = new ValidationError('File upload error');
    }
  }

  // Set default status code if not set
  if (!processedError.statusCode) {
    processedError.statusCode = 500;
  }

  // Log error
  const logLevel = processedError.statusCode >= 500 ? 'error' : 'warn';
  logger[logLevel]('Request error:', {
    error: {
      message: processedError.message,
      stack: processedError.stack,
      statusCode: processedError.statusCode,
      name: processedError.name
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      body: req.method !== 'GET' ? req.body : undefined,
      params: req.params,
      query: req.query
    }
  });

  // Send error response
  const errorResponse = formatErrorResponse(processedError, req);
  res.status(processedError.statusCode).json(errorResponse);
};

// 404 handler for unmatched routes
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(
    `Route ${req.method} ${req.originalUrl} not found`
  );
  next(error);
};

// Request timeout middleware
const timeoutHandler = (timeoutMs = 30000) => {
  return (req, res, next) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        const error = new AppError('Request timeout', 408);
        next(error);
      }
    }, timeoutMs);

    // Clear timeout when response is sent
    res.on('finish', () => {
      clearTimeout(timeout);
    });

    next();
  };
};

// Request ID middleware
const requestIdMiddleware = (req, res, next) => {
  req.id = req.get('X-Request-ID') || 
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  res.set('X-Request-ID', req.id);
  next();
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  });
  next();
};

// CORS error handler
const corsErrorHandler = (req, res, next) => {
  const origin = req.get('Origin');
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://statsor.com'
  ];

  if (origin && !allowedOrigins.includes(origin)) {
    const error = new AuthorizationError(
      `CORS policy: Origin ${origin} is not allowed`
    );
    return next(error);
  }

  next();
};

// Health check middleware
const healthCheck = (req, res) => {
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024)
    },
    cpu: process.cpuUsage()
  };

  res.status(200).json(healthData);
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      requestId: req.id
    };

    if (res.statusCode >= 400) {
      logger.warn('Request completed with error:', logData);
    } else {
      logger.info('Request completed:', logData);
    }
  });

  next();
};

