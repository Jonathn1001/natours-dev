const { catchAsync, filterObj, upload, resizeImage } = require('../helper');
const User = require('../models/UserModel');
const AppError = require('../utils/AppError');
const factory = require('./handlerFactory');

// ? [GET] Get Current User Logged In
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.uploadPhoto = upload.single('photo');

exports.resizeUserPhoto = async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await resizeImage(req.file.buffer, 500, 500, 'users', req.file.filename);

  next();
};

// ? [PATCH] Update Current Logged In User
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1. Create Error if user POSTs password data
  if (req.body.password || req.body.confirmPassword) {
    const err = new AppError('This route is not for password updates', 400);
    return next(err);
  }
  // 2. Filter out unwanted field names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;

  // 3. Update user document
  const user = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    user,
  });
});
// ? [DELETE] Update Current Logged In User
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
// ? [GET] Get All Users
exports.getAllUsers = factory.getAll(User);
// ? [GET] Get  User By Id
exports.getUser = factory.getOne(User);
// ? [PATCH] => Update User (expect the app receive the entire new updated object)
exports.updateUser = factory.updateOne(User);
// ? [DELETE] => Delete User
exports.deleteUser = factory.deleteOne(User);
