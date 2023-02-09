const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    require: [true, 'Booking must belong to a tour!'],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    require: [true, 'Booking must belong to a user!'],
  },
  price: {
    type: Number,
    required: [true, 'Booking must have a price!'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  paid: {
    type: Boolean,
    default: true,
  },
});

BookingSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'tour',
    select: 'name',
  }).populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

module.exports = mongoose.model('Booking', BookingSchema);
