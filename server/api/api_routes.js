'use strict';

var userController = require('./user/user_controllers.js')
  , scanController = require('./scan/scan_controllers.js')
  , locationController = require('./location/location_controllers.js')
  , doodleController = require('./thousand/doodle_controller.js')
  ;

module.exports = exports = function (router) {
  router.route('/users').get(userController.getAll);
  router.route('/user/:id').get(userController.getUser);

  router.route('/scan/:id').get(scanController.getScan);
  router.route('/scans/:beaconId').get(scanController.getScans);
  router.route('/scans/:beaconId/limit/:limit').get(scanController.getScans);

  router.route('/locations').get(locationController.getAll);
  router.route('/location/:id').get(locationController.getLocation);

  router.route('/doodle/:containerId').get(doodleController.getImage);
  router.route('/doodle/:containerId').post(doodleController.receiveImage);
  router.route('/doodle/random/:numDoodles').get(doodleController.randomDoodles);
}
