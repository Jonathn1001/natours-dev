const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../src/models/TourModel');
const User = require('../../src/models/UserModel');
const Review = require('../../src/models/ReviewModel');

dotenv.config({ path: './config.env' });

const db = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

const connect = async () => {
  try {
    await mongoose.connect(db);
    console.log('database connect successfully!!!');
  } catch (error) {
    console.log('connection failed', error.message);
  }
};

// ? Read JSON File
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

// ? Import Data Into DB
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log('Data successfully loaded');
  } catch (error) {
    console.log(error.message);
  }
  process.exit();
};

// ? Delete All Data From DB
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Data successfully loaded');
  } catch (error) {
    console.log(error.message);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

connect();
