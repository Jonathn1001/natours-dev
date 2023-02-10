const tourRouter = require('./tourRoutes');
const userRouter = require('./userRoutes');
const reviewRouter = require('./reviewRoutes');
const viewRouter = require('./viewRoutes');
const bookingRouter = require('./bookingRoutes');
const AppError = require('../utils/AppError');

const routes = (app) => {
  app.use('/', viewRouter);
  app.use('/api/v1/tours', tourRouter);
  app.use('/api/v1/users', userRouter);
  app.use('/api/v1/reviews', reviewRouter);
  app.use('/api/v1/bookings', bookingRouter);

  // ? 404 Route
  app.all('*', (req, res, next) => {
    // ? create an error with status code and message
    const err = new AppError(
      `Can't find ${req.originalUrl} on this server`,
      404
    );
    // ? next() always takes error as parameter
    next(err);
  });
};

module.exports = routes;
