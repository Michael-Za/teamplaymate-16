const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400);
    this.errors = errors;
  }
}

class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed', error = null) {
        super(message, 401);
        this.originalError = error;
    }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
  }
}

const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const isDevelopment = process.env.NODE_ENV === 'development';
  const responseError = {
    message: error.message || 'An unexpected error occurred.',
    status: error.statusCode || 500,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
  };

  if (error instanceof ValidationError) {
    responseError.validation_errors = error.errors;
  }

  if (isDevelopment) {
    responseError.stack = error.stack;
    if (error.originalError) {
        responseError.original_error = error.originalError.message;
    }
  }

  logger.error('Request error:', { error: responseError, request: { /* ... */ } });
  res.status(responseError.status).json({ error: responseError });
};

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const validateRequest = (schema) => (req, res, next) => {
  const toValidate = {};
  if (schema.describe().keys.body) {
    toValidate.body = req.body;
  }
  if (schema.describe().keys.query) {
    toValidate.query = req.query;
  }
  if (schema.describe().keys.params) {
    toValidate.params = req.params;
  }

  const { error } = schema.validate(toValidate, { abortEarly: false });

  if (error) {
    const validationErrors = error.details.map(detail => ({
      message: detail.message,
      path: detail.path,
    }));
    return next(new ValidationError('Request validation failed', validationErrors));
  }

  next();
};

module.exports = {
  errorHandler,
  asyncHandler,
  validateRequest,
  AppError,
  ValidationError,
  AuthenticationError,
  ConflictError,
};