'use strict';

var express = require('express')
  , app = express()
  , path = require('path')
  , router = express.Router()
  , bodyParser = require('body-parser')
  , http = require('http')
  , fs = require('fs')
  ;
var  client_configs = fs.readFileSync(path.join( __dirname, '..', 'static', 'js', 'config.js')).toString();
var sketchController = require(path.join(__dirname,'api','sketch_controller.js'))
  , winnersController = require(path.join(__dirname,'api','winners_controller.js'))
  , config = require(path.join(__dirname,'config.js'))
  , proxy = require(path.join(__dirname,'proxy.js'))
  , middle = require(path.join(__dirname,'middleware.js'))

// Allow self-signed SSL
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// app config
app.set('port', config.get('PORT'));
app.set('base url', config.get('IP'));
app.use(middle.basicAuth);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(middle.cors);
app.get( '/js/config.js', function (req, res, next) {
  console.log('Fetching client configs...');
  return res.send(client_configs.replace(/winner_count: 10/, "winner_count: " + config.get("WINNER_COUNT"))); 
});
app.get( new RegExp("/direct\/([.0-9]+)\/(.*)"), proxy.directPath);
app.use(express.static(path.join(__dirname, '..', 'static')));
// For the Mobile App
app.use('/node_modules', express.static(path.join(__dirname, '..', 'node_modules')));
app.use('/api', router);
app.use(middle.logError);
app.use(middle.handleError);

// routes
app.get( /^\/direct\/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/, proxy.directPath);
app.get( /^\/direct\/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(.*)/, proxy.directPath);
app.put( /^\/direct\/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/, proxy.directPath);
app.put( /^\/direct\/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(.*)/, proxy.directPath);
app.post( /^\/direct\/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/, proxy.directPath);
app.post( /^\/direct\/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(.*)/, proxy.directPath);

app.get( /^\/api\/v1\/namespaces\/(\w)\/pods\/(\w)\/proxy\/(.*)/, proxy.path);
app.get( /^\/api\/v1\/namespaces\/(\w)\/pods\/(\w)\/proxy/, proxy.path);
app.put( /^\/api\/v1\/namespaces\/(\w)\/pods\/(\w)\/proxy\/(.*)/, proxy.path);
app.put( /^\/api\/v1\/namespaces\/(\w)\/pods\/(\w)\/proxy/, proxy.path);
app.post( /^\/api\/v1\/namespaces\/(\w)\/pods\/(\w)\/proxy\/(.*)/, proxy.path);
app.post( /^\/api\/v1\/namespaces\/(\w)\/pods\/(\w)\/proxy/, proxy.path);

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
