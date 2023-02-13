const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

// * User Resources
const router = express.Router();

// !!! Authentication And Authorization
router.post('/sign-up', authController.signup);
router.get('/verify-account/:token', authController.verifyAccount);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.get('/reset-password/:token', authController.resetPassword);

// ? Protect all routes after this middleware
router.use(authController.protect);

// ? User Profile Settings
router.patch('/update-password', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUser);
router
  .route('/update-me')
  .patch(
    userController.uploadPhoto,
    userController.resizeUserPhoto,
    userController.updateMe
  );
router.delete('/delete-me', userController.deleteMe);

router.use(authController.restrictTo('admin'));
// ? These routes below  used for admin manage users.
router.get('/', userController.getAllUsers);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
