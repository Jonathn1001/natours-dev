const express = require('express');
const viewController = require('../controllers/viewController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(viewController.alerts);

// * Tours views
router.get('/', authController.isLoggedIn, viewController.getOverview);
router.get('/tour/:slug', authController.isLoggedIn, viewController.getTour);

// * Auth views
router.get('/login', viewController.getLoginForm);
router.get('/sign-up', viewController.getSignupForm);
router.get('/verify-account', viewController.getVerifyAccountForm);
router.get('/active-account', viewController.getActiveAccountForm);

// * Users views
router.get('/me', authController.protect, viewController.getMe);
router.get('/my-tours', authController.protect, viewController.getMyTours);
router.post(
  '/submit-user-data',
  authController.protect,
  viewController.updateUserData
);

module.exports = router;
