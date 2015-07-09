'use strict';

var express = require('express')
  , app = express()
  , config = require('./config')
  , router = express.Router()
  , bodyParser = require('body-parser')
  , middle = require('./middleware')
  , http = require('http')
  , sketchController = require('./api/sketch_controller.js')
  , winnersController = require('./api/winners_controller.js')
  ;

// Allow self-signed SSL
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// app config
app.set('port', config.get('PORT'));
app.set('base url', config.get('IP'));
app.use(middle.basicAuth);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(middle.cors);
app.use(express.static(__dirname + '/../static'));
app.use('/node_modules', express.static(__dirname + '/../node_modules'));
app.use('/api', router);
app.use(middle.logError);
app.use(middle.handleError);

// routes
router.route('/sketch/:containerId').get(sketchController.getImage);
router.route('/sketch/:containerId/image.png').get(sketchController.getImage);
router.route('/sketch/:containerId/page.html').get(sketchController.getImagePage);
router.route('/sketch/:containerId').post(sketchController.receiveImage);
router.route('/sketch/:containerId').delete(sketchController.removeImage);
router.route('/sketch/random/:numSketches').get(sketchController.randomSketches);
router.route('/winners').put(winnersController.saveWinners);
router.route('/winners').get(winnersController.listWinners);

module.exports = exports = app;
