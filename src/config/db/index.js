const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

const db = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose.set('strictQuery', true);

const connect = async () => {
  try {
    await mongoose.connect(db);
    console.log('database connect successfully!!!');
  } catch (error) {
    // console.log('connection failed', error.message);
    throw new Error(error);
  }
};

module.exports = { connect };
