const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = err.statusCode || err.status || res.statusCode;
  if (!statusCode || statusCode < 400) {
    statusCode = 500;
  }

  let message = err.message || "Server error";

  // Normalize common Mongoose errors into consistent client responses.
  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource identifier";
  }

  if (err.code === 11000) {
    statusCode = 409;
    message = "Duplicate resource";
  }

  if (statusCode >= 500) {
    console.error(err.stack);
  }

  const payload = { message };

  if (process.env.NODE_ENV === "development") {
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
};

module.exports = { notFound, errorHandler };
