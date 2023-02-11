const dotenv = require('dotenv');
// Inject .env file into current process
dotenv.config({ path: './config.env' });

const app = require('./src/app');
const db = require('./src/config/db');

// ! Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('UNCAUGHT EXCEPTION !!! Shutting down...');
  process.exit(1);
});

// ? Port (behind the scenes, Heroku randomly assigns a port)
const port = process.env.PORT || 5000;

// ? Connect To DB
db.connect();

// ? App
const server = app.listen(port, () => {
  console.log(`App running on port ${port}`);
});

// ! handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED Rejection !!! Shutting down...');
  server.close(() => {
    process.exit(1);
  });
});

// ! Graceful shutdown when recived SIGTERM
process.on('SIGTERM', () => {
  console.log(
    'SIGTERM Received !!!Graceful shutdown start',
    new Date().toISOString()
  );
  server.close(() => {
    console.log('Process terminated!');
  });
});
