const dotenv = require('dotenv');
// Inject .env file into current process
dotenv.config({ path: './config.env' });

const app = require('./src/app');
const db = require('./src/config/db');

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('UNCAUGHT EXCEPTION !!! Shutting down...');
  process.exit(1);
});

const port = process.env.PORT || 5000;

// Database
db.connect();

const server = app.listen(port, () => {
  console.log(`App running on port ${port}`);
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED Rejection !!! Shutting down...');
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log(
    'SIGTERM Received !!!Graceful shutdown start',
    new Date().toISOString()
  );
  server.close(() => {
    console.log('Process terminated!');
  });
});
