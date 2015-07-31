'use strict';

var express = require('express')
  , app = express()
  , config = require('./config')
  , proxy = require('./proxy')
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
// For the Mobile App
app.use('/node_modules', express.static(__dirname + '/../node_modules'));
app.use('/api', router);
app.use(middle.logError);
app.use(middle.handleError);

// routes
app.get( new RegExp("/direct\/([.0-9]+)\/(.*)"), proxy.directPath);
app.get( new RegExp("/direct\/([.0-9]+)"), proxy.directPath);
app.put( new RegExp("/direct\/([.0-9]+)\/(.*)"), proxy.directPath);
app.put( new RegExp("/direct\/([.0-9]+)"), proxy.directPath);
app.post(new RegExp("/direct\/([.0-9]+)\/(.*)"), proxy.directPath);
app.post(new RegExp("/direct\/([.0-9]+)"), proxy.directPath);
app.get( new RegExp("/("+config.get('NAMESPACE')+")\/pods\/([-a-zA-Z0-9_]+)\/proxy\/(.*)"), proxy.path);
app.get( new RegExp("/("+config.get('NAMESPACE')+")\/pods\/([-a-zA-Z0-9_]+)\/(.*)"), proxy.path);
app.get( new RegExp("/("+config.get('NAMESPACE')+")\/([-a-zA-Z0-9_]+)\/(.*)"), proxy.path);
app.put( new RegExp("/("+config.get('NAMESPACE')+")\/([-a-zA-Z0-9_]+)\/(.*)"), proxy.path);
app.post(new RegExp("/("+config.get('NAMESPACE')+")\/([-a-zA-Z0-9_]+)\/(.*)"), proxy.path);
app.get( new RegExp("/("+config.get('NAMESPACE')+")\/([-a-zA-Z0-9_]+)"), proxy.path);
app.put( new RegExp("/("+config.get('NAMESPACE')+")\/([-a-zA-Z0-9_]+)"), proxy.path);
app.post(new RegExp("/("+config.get('NAMESPACE')+")\/([-a-zA-Z0-9_]+)"), proxy.path);
app.get( /^\/api\/v1beta3\/NAMESPACEs\/(\w)\/pods\/(\w)\/proxy\/(.*)/, proxy.path);
app.get( /^\/api\/v1beta3\/NAMESPACEs\/(\w)\/pods\/(\w)\/proxy/, proxy.path);

app.get('/status', function (req, res, next) { res.send("{status: 'ok'}"); return next() });
router.route('/sketch/:containerId').get(sketchController.getImage);
router.route('/sketch/:containerId/image.png').get(sketchController.getImage);
router.route('/sketch/:containerId/page.html').get(sketchController.getImagePage);
router.route('/sketch/:containerId').post(sketchController.receiveImage);
router.route('/sketch/:containerId').delete(sketchController.removeImage);
router.route('/sketch/random/:numSketches').get(sketchController.randomSketches);
router.route('/winners').put(winnersController.saveWinners);
router.route('/winners').get(winnersController.listWinners);

module.exports = exports = app;
