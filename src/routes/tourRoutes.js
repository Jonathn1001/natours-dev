const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

//* Tours Resources
const router = express.Router();

// ? Get Tour Reviews
router.use('/:tourId/reviews', reviewRouter);

// ? Get Tour Statistics
router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

// ? Aliasing Route
router
  .route('/top-5-awesome-tours')
  .get(tourController.aliasingTopTours, tourController.getAllTours);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

// ? Get The Tours With In The Given Location
router.get(
  '/tours-within/:distance/center/:latlng/unit/:unit',
  tourController.getToursWithIn
);
// ? Get Distances From The Given Location To The Tours's Start Location
router.get('/distances/:latlng/unit/:unit', tourController.getDistances);

// ? Tours Management
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
