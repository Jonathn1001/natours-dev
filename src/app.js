const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const globalErrorHandler = require('./controllers/errorController');
const bookingController = require('./controllers/bookingController');
const routes = require('./routes');

// Start express app
const app = express();

// Implement Cors
app.use(cors());
// Access-Control-Allow-Origin *

// Handle options request (in preflight phrase of non-simple request: PUT, PATCH, DELETE)
app.options('*', cors());

app.enable('trust proxy');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// * Global Middlewares

// ? Serving static files
app.use('/img', express.static('public/img'));
app.use('/css', express.static('public/css'));
app.use('/js', express.static('public/js'));

// ? Set Security HTTP Headers
app.use(
  helmet({ crossOriginEmbedderPolicy: false, contentSecurityPolicy: false })
);

// ? Development Logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ? Limit requests from the same API, Prevent DOS or Brute Force Attack
const limiter = rateLimit({
  windowMS: 60 * 60 * 1000,
  max: 10, // Limit each IP to 100 requests per `window` (here, per 1 hour),
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// ? Implement Stripe Webhook Checkout
app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  bookingController.webhookCheckout
);

// ? Body parsers: reading data from body into res.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ? Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// ? Data sanitization against XSS
app.use(xss());

app.use(compression());

// ? Prevent HTTP Parameter Pollutiourn Attacks
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingAverage',
      'ratingQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// * Routing
routes(app);

// !! Error Handling Middleware
app.use(globalErrorHandler);

module.exports = app;
