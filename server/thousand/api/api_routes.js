'use strict';

var sketchController = require('./thousand/sketch_controller.js')
  , winnersController = require('./thousand/winners_controller.js')
  ;

module.exports = exports = function (router) {
  router.route('/sketch/:containerId').get(sketchController.getImage);
  router.route('/sketch/:containerId/image.png').get(sketchController.getImage);
  router.route('/sketch/:containerId/page.html').get(sketchController.getImagePage);
  router.route('/sketch/:containerId').post(sketchController.receiveImage);
  router.route('/sketch/:containerId').delete(sketchController.removeImage);
  router.route('/sketch/random/:numSketches').get(sketchController.randomSketches);
  router.route('/winners').put(winnersController.saveWinners);
  router.route('/winners').get(winnersController.listWinners);
}
