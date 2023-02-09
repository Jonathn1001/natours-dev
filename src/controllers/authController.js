const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');
const { catchAsync } = require('../helper');
const AppError = require('../utils/AppError');
const Email = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const accessToken = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  // Remove the password from the output
  user.password = undefined;

  res.cookie('jwt', accessToken, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    accessToken,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const { name, email, role, password, confirmPassword, passwordChangedAt } =
    req.body;

  const newUser = await User.create({
    name,
    email,
    password,
    confirmPassword,
    passwordChangedAt,
    role,
  });
  const url = `${req.protocol}://${req.get('host')}/me`;

  createSendToken(newUser, 201, res);

  await new Email(newUser, url).sendWelcome();
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // 1. Check if email and password exist
  if (!email || !password) {
    const err = new AppError('Please provide email and password', 400);
    return next(err);
  }

  // 2. Check if user exists or password is correct
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    const err = new AppError('Incorrect Email Or Password', 401);
    return next(err);
  }

  // 3. If everything is okay, send the token back
  createSendToken(user, 200, res);
});

// ! Only for rendered pages, no errors !!!
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 2. Verify the token (promisfy return a function that return a promise) => 2 cases caught error: JsonWebTokenError and TokenExpiredError
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET_KEY
      );

      // 2. Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3.Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // * There is a logged in user (put the user into res.local in order to used pug template)
      res.locals.user = currentUser;
      return next();
    } catch (error) {
      return next();
    }
  }
  next();
};

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

// ! Protect our api request routes
exports.protect = catchAsync(async (req, res, next) => {
  // 1. Getting the token of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    const err = new AppError(
      'You are not logged in! Please log in to get access',
      401
    );
    return next(err);
  }
  // 2. Validate the token (promisfy return a function that return a promise) => 2 cases caught error: JsonWebTokenError and TokenExpiredError
  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET_KEY
  );

  // 3. Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    const err = new AppError(
      'The user belonging to this token does no longer exists',
      401
    );
    return next(err);
  }
  // 4.Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    const err = new AppError(
      'User recently changed password! Please login again',
      401
    );
    return next(err);
  }

  // * GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});

// ? using curried function here to access roles as parameter of outer function
exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    // roles ['admin', 'lead-guide']. role='user'
    if (!roles.includes(req.user.role)) {
      const err = new AppError(
        'You do not have permission to perform this action',
        403
      );
      return next(err);
    }

    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    const err = new AppError('There is no user with that email address', 404);
    return next(err);
  }
  // 2. Generate the random token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3. Send it to user's email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/reset-password/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({ validateBeforeSave: false });
    const err = new AppError(
      'There was an error when sending the email. Try again later',
      500
    );
    return next(err);
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1. Get the user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    // ? check if token has not expired yet
    passwordResetExpires: { $gte: Date.now() },
  });
  if (!user) {
    const err = new AppError('Token is invalid or has expired', 400);
    return next(err);
  }
  // 2. If token has not expired, and there is user, set the new password
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  // 3. Update the passwordChangedAt property for the user

  // 4. Log the user in, send JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1. Get user from collection
  const user = await User.findById(req.user.id).select('+password');
  // 2. Check if POSTed password is correct
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    const err = new AppError('Your current password is wrong', 401);
    return next(err);
  }
  // 3. If true, update password
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();
  // 4. Log user in, send JWT
  createSendToken(user, 200, res);
});
