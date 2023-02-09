const mongoose = require('mongoose');
const slugify = require('slugify');

const TourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [50, 'A  Tour must have less or equal than 50 characters'],
      minlength: [10, 'A  Tour must have more or equal than 10 characters'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have difficulty'],
      // ! only for string
      enum: {
        values: ['easy', 'medium', 'difficult', 'awesome'],
        message: 'Difficulty is either: easy, medium, difficult and awesome',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      // !! not only for number, either date
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // ? this refers to document when .save() and.create() method called
          return val < this.price;
        },
        message:
          'The Discount Price {{VALUE}} should Be Below The Regular Price',
      },
    },
    summary: {
      type: String,
      trim: true, // remove all the whitespace
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String, // name of the image
      require: [true, 'A tour must have a cover image'],
    },
    images: [String],
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        // ? create the relationship between 2 datasets
        ref: 'User',
      },
    ],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

TourSchema.index({ price: 1, ratingsAverage: -1 });
TourSchema.index({ slug: 1 });
// !! For spherical queries, use the 2dsphere index result
TourSchema.index({ startLocation: '2dsphere' });

TourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// !! Virtual Populate
TourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// !! Document Middleware: the pre hooked method runs before .save() and create();
TourSchema.pre('save', function (next) {
  // ? this refers to currently being save document
  this.slug = slugify(this.name, { lower: true });
  next();
});

// TourSchema.pre('save', (next) => {
//   next();
// });

// ? post middleware are executed after the hooked method and all of its pre middleware have completed.
// TourSchema.post('save', (doc, next) => {
//   console.log(doc);
//   next();
// });

// ? Embedding Guides To Tours Docs
// TourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// !! Query Middleware
// ? regular expression for all methods starting by find: finedOne, findAndUpdate, findAndDelete ,...
TourSchema.pre(/^find/, function (next) {
  // ? this refers to currently processing query
  this.find({ secretTour: { $ne: true } });
  this.startTime = Date.now();
  next();
});

TourSchema.pre(/^find/, function (next) {
  // ? this refers to currently processing query
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt -createdAt -updatedAt',
  });
  next();
});

// !! Aggregation Middleware
// TourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   console.log(this.pipeline());
//   next();
// });

// ? Run after the query has already executed
TourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took: ${Date.now() - this.startTime} ms!`);
  next();
});

module.exports = mongoose.model('Tour', TourSchema);

// !!!!! SANITIZATION !!!
