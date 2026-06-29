const errorHandler = (err, req, res, next) => {
  // Prefer a status a controller already set (4xx/5xx); otherwise honor a status
  // carried on the error (e.g. multer's fileFilter rejection); never let a
  // thrown error fall through as a 2xx, which a client would read as success.
  const statusCode =
    res.statusCode && res.statusCode >= 400
      ? res.statusCode
      : err.status || err.statusCode || 500;

  res.status(statusCode);

  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { errorHandler };