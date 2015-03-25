'use strict';

var userController = require('./user/user_controllers.js')
  ;

module.exports = exports = function (router) {
  router.route('/users').get(userController.getAll);
}
