const mongoose = require('mongoose');
const Tour = require('./TourModel');

const ReviewSchema = mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty'],
    },
    rating: {
      type: Number,
      default: 4.5,
      min: 1,
      max: 5,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong a tour'],
    },
  },
  // ? Virtual Property: is a field not stored in the db but calculated using some other value, show up as an output (response object)
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

ReviewSchema.index({ tour: 1, user: 1 }, { unique: true });

ReviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

ReviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: stats[0].avgRating,
      ratingsQuantity: stats[0].nRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: 0,
      ratingsQuantity: 4.5,
    });
  }
};

ReviewSchema.pre(/^findOneAnd/, async function (next) {
  this.review = await this.findOne().clone();
  next();
});

ReviewSchema.post(/^findOneAnd/, async function (next) {
  // this.findOne() does not work, this query has been already executed
  await this.review.constructor.calcAverageRatings(this.review.tour);
});

// ? Call static functions after the new review saved to db
ReviewSchema.post('save', function () {
  // this point to current review doc, this.constructor is the model which created that doc
  this.constructor.calcAverageRatings(this.tour);
});

module.exports = mongoose.model('Review', ReviewSchema);
