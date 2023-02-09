const { catchAsync, upload, resizeImage } = require('../helper');
const Tour = require('../models/TourModel');
const AppError = require('../utils/AppError');

const factory = require('./handlerFactory');

// ? Middleware
exports.checkBody = (req, res, next) => {
  if (!req.body.name || !req.body.price) {
    res.status(400).json({
      status: 'failed',
      message: 'Missing name or price',
    });
    return;
  }

  next();
};

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  // 1. Cover Image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await resizeImage(
    req.files.imageCover[0].buffer,
    2000,
    1333,
    'tours',
    req.body.imageCover
  );

  // 2. Images
  req.body.images = [];
  await Promise.all(
    // ? Return array of promises from the async function
    req.files.images.map(async (file, index) => {
      const fileName = `tour-${req.params.id}-${Date.now()}-${index + 1}.jpeg`;
      await resizeImage(file.buffer, 2000, 1333, 'tours', fileName);
      req.body.images.push(fileName);
    })
  );

  next();
};

// ? [GET] Get Top 5 Tours By Difficulty
exports.aliasingTopTours = catchAsync(async (req, res, next) => {
  req.query.limit = '5';
  req.query.sortBy = 'difficulty';
  req.query.fields = 'name,price,ratingAverage,summary,difficulty';
  next();
});

// ? [GET] Get All Tours
exports.getAllTours = factory.getAll(Tour);
// ? [GET] Get  Tour By Id
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
// ? [POST] Create New Tour
exports.createTour = factory.createOne(Tour);
// ? [PATCH] => Update Tour (expect the app receive the entire new updated object)
exports.updateTour = factory.updateOne(Tour);
// ? [DELETE] => Delete Tour
exports.deleteTour = factory.deleteOne(Tour);

// ? [GET] Using Aggregation Pipeline To Statisticize
exports.getTourStats = catchAsync(async (req, res) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        // _id: '$ratingAverage',
        _id: '$difficulty',
        numTours: { $sum: 1 },
        numRating: { $sum: '$ratingQuantity' },
        avgRating: { $avg: '$ratingAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    // {
    //   $match: { _id: { $ne: 'easy' } },
    // },
  ]);

  res.status(200).json({
    status: 'success',
    results: stats.length,
    data: {
      stats,
    },
  });
});

// ? [GET] Get Monthly Plan In The Year
exports.getMonthlyPlan = catchAsync(async (req, res) => {
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        // ? startDate must between the first day and the end day of the year
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { month: 1 },
    },
  ]);

  res.status(200).json({
    status: 'success',
    results: plan.length,
    data: plan,
  });
});

// ? [GET] Get Tours Within Distance
exports.getToursWithIn = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng.'
      )
    );
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: tours,
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng.'
      )
    );
  }

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        name: 1,
        distance: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    results: distances.length,
    data: distances,
  });
});
