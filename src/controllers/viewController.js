const { catchAsync } = require('../helper');
const Booking = require('../models/BookingModel');
const Tour = require('../models/TourModel');
const User = require('../models/UserModel');
const AppError = require('../utils/AppError');

exports.getOverview = catchAsync(async (req, res) => {
  // 1. Get tour data from collection
  const tours = await Tour.find();
  // 2. Build template
  // 3. Render that template using tour data
  res.status(200).render('pages/tour/overview', {
    title: 'All Tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1. Get tour data from collection
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    select: 'review rating user',
  });

  if (!tour) {
    const err = new AppError('There is no tour with that name', 404);
    return next(err);
  }

  // 2. Build template
  // 3. Render Template With Injected Data
  res.status(200).render('pages/tour/detail', {
    title: `${tour.name} Tour`,
    tour,
  });
});

exports.getLoginForm = catchAsync(async (req, res) => {
  res.status(200).render('pages/auth/login', {
    title: 'Log into your account',
  });
});

exports.getSignupForm = catchAsync(async (req, res) => {
  res.status(200).render('pages/auth/signup', {
    title: 'Register your account',
  });
});

exports.getVerifyAccountForm = catchAsync(async (req, res) => {
  res.status(200).render('pages/auth/verify-account', {
    title: 'Verify account',
  });
});

exports.getActiveAccountForm = catchAsync(async (req, res) => {
  res.status(200).render('pages/auth/active-account', {
    title: 'Active account',
  });
});

exports.getForgotPasswordForm = catchAsync(async (req, res) => {
  res.status(200).render('pages/auth/forgot-password', {
    title: 'Forgot password',
  });
});

exports.getMe = catchAsync(async (req, res) => {
  res.status(200).render('pages/user/account', {
    title: 'Your Account',
    user: req.user,
  });
});

exports.getMyTours = catchAsync(async (req, res) => {
  // 1. Find all bookings of current user
  const bookings = await Booking.find({ user: req.user.id });
  // 2. Find tour with the return ID
  const tourIDs = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render('pages/tour/overview', {
    title: 'My Tours',
    tours,
  });
});

exports.updateUserData = catchAsync(async (req, res) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    }
  );
  res.status(200).render('account', {
    title: 'Your Account',
    user: updatedUser,
  });
});

exports.alerts = (req, res, next) => {
  const { alert } = req.query;

  if (alert === 'booking') {
    res.locals.alert =
      "Your booking was successful! Please check your email for confirmation. If your booking doesn't show up here immediately, please comeback later.";
  }

  next();
};
