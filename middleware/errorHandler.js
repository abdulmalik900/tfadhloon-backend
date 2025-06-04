// Error handling middleware for TFADHLOON game backend

export const errorResponseHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error response
  let error = {
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    error.status = 'fail';
    error.message = 'Validation Error';
    error.details = Object.values(err.errors).map(val => val.message);
    return res.status(400).json(error);
  }

  if (err.name === 'CastError') {
    error.status = 'fail';
    error.message = 'Invalid ID format';
    return res.status(400).json(error);
  }

  if (err.code === 11000) {
    error.status = 'fail';
    error.message = 'Duplicate field value';
    return res.status(400).json(error);
  }

  if (err.name === 'JsonWebTokenError') {
    error.status = 'fail';
    error.message = 'Invalid token';
    return res.status(401).json(error);
  }

  if (err.name === 'TokenExpiredError') {
    error.status = 'fail';
    error.message = 'Token expired';
    return res.status(401).json(error);
  }

  // Send error response
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json(error);
};

export default errorResponseHandler;
