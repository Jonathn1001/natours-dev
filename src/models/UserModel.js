const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const UserSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please Tell Us Your Name'],
    },
    email: {
      type: String,
      required: [true, 'Please Tell Us Your Email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    photo: {
      type: String,
      default: 'default.jpg', // ? store the path of the photo saved in our system
    },
    role: {
      type: String,
      enum: ['user', 'guide', 'lead-guide', 'admin'],
      default: 'user',
    },
    password: {
      type: String,
      required: true,
      validate: [validator.isStrongPassword, 'Please set a strong password'],
      select: false,
    },
    confirmPassword: {
      type: String,
      required: [true, 'Please confirm your password'],
      validate: {
        // !! this only work on CREATE() and SAVE() !!!
        validator: function (confirmPwd) {
          return validator.matches(confirmPwd, this.password);
        },
        message: 'Confirm password does not match',
      },
    },
    passwordChangedAt: {
      type: Date,
    },
    verifyAccountToken: String,
    verifyAccountExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// ? Encrypt The Password With PreSave Hook
UserSchema.pre('save', async function (next) {
  // ? Only run this function if password actually modified
  if (!this.isModified('password')) return next();

  // ? Hash the password with the cost 12
  this.password = await bcrypt.hash(this.password, 12);

  // ? no need to store password confirm to database, just use for validate at the view
  this.confirmPassword = undefined;

  next();
});

// ? Set the changedPasswordAt active
UserSchema.pre('save', function (next) {
  // ? Only run this function if password actually modified
  if (!this.isModified('password') || this.isNew) return next();

  // ? trick: ensure the token is always created after the password has been changed
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// ? Filter
// UserSchema.pre(/^find/, function (next) {
//   // this point to current query
//   this.find({ active: true });
//   next();
// });

// ? Define our own custom document instance methods.
// ! this refers to the current document
UserSchema.methods.correctPassword = async function (candidatePwd, userPwd) {
  return await bcrypt.compare(candidatePwd, userPwd);
};

UserSchema.methods.changedPasswordAfter = function (tokenTimestamp) {
  if (this.passwordChangedAt) {
    // eslint-disable-next-line radix
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000);
    // ? return true if token issued before password changed => that mean token was expired
    return tokenTimestamp < changedTimestamp;
  }

  // False mean not changed
  return false;
};

UserSchema.methods.createVerifyAccountToken = function () {
  const verifyToken = crypto.randomBytes(32).toString('hex');
  //! stored encrypted verify account token to db
  this.verifyAccountToken = crypto
    .createHash('sha256')
    .update(verifyToken)
    .digest('hex');

  // ! Token expires in 7 days
  this.verifyAccountExpires = Date.now() + 7 * 24 * 60 * 60 * 1000;

  return verifyToken;
};

UserSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  // ! stored encrypted reset token to db
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model('User', UserSchema);
