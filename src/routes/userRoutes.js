const express = require('express');

const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

// * User Resources
const router = express.Router();

// !!! Authentication And Authorization
router.route('/sign-up').post(authController.signup);
router.route('/login').post(authController.login);
router.route('/logout').post(authController.logout);
router.route('/forgot-password').post(authController.forgotPassword);
router.route('/reset-password/:token').patch(authController.resetPassword);

// ? Protect all routes after this middleware
router.use(authController.protect);

router.route('/update-password').patch(authController.updatePassword);

router.route('/me').get(userController.getMe, userController.getUser);
router
  .route('/update-me')
  .patch(
    userController.uploadPhoto,
    userController.resizeUserPhoto,
    userController.updateMe
  );
router.route('/delete-me').delete(userController.deleteMe);

router.use(authController.restrictTo('admin'));
// ? These routes below  used for admin manage users.
router.route('/').get(userController.getAllUsers);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
