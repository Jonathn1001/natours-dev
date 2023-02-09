class AppError extends Error {
  constructor(message, statusCode) {
    // ? inherit the parent constructor => Error constructor take it as error message
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith(4) ? 'fail' : 'err';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
