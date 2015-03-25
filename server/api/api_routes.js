'use strict';

var userController = require('./user/user_controllers.js')
  , locationController = require('./location/location_controllers.js')
  ;

module.exports = exports = function (router) {
  router.route('/users').get(userController.getAll);
  router.route('/user/:id').get(userController.getUser);

  router.route('/locations').get(locationController.getAll);
  router.route('/location/:id').get(locationController.getLocation);
}
