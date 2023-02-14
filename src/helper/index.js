// eslint-disable-next-line import/no-extraneous-dependencies
const multer = require('multer');
// eslint-disable-next-line import/no-extraneous-dependencies
const sharp = require('sharp');
const AppError = require('../utils/AppError');

// ? Keep the image as the buffer
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images', 400), false);
  }
};

// ? Upload Photo
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// ? Resize user uploaded image (as a buffer)
const resizeImage = (buffer, width, height, folder, fileName) =>
  sharp(buffer)
    .resize(width, height)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/${folder}/${fileName}`);

// ? Syntax of currying function
const catchAsync = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next);
};

// ? Filter object by allowed fields
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((item) => {
    if (allowedFields.includes(item)) {
      newObj[item] = obj[item];
    }
  });
  return newObj;
};

module.exports = { catchAsync, upload, resizeImage, filterObj };
