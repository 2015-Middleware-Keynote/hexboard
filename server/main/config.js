'use strict';

var morgan      = require('morgan')
 ,  bodyParser  = require('body-parser')
 ,  middle      = require('./middleware')
 ;

module.exports = exports = function (app, express, routers) {
  app.set('port', process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 9000);
  app.set('base url', process.env.OPENSHIFT_NODEJS_IP || process.env.URL || '0.0.0.0');
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(middle.cors);
  var staticRoot = __dirname + '/../../client/src';
  app.use(express.static(__dirname + '/../../client'));
  app.use(morgan('dev'));
  app.use('/api', routers.apiRouter);
  app.use(middle.logError);
  app.use(middle.handleError);
};
