'use strict';

var express = require('express')
  , app = express()
  , routers = {}
  , apiRouter = express.Router()
  ;

routers.apiRouter = apiRouter;

require('./config.js')(app, express, routers);
require('../api/api_routes.js')(apiRouter);
require('./db')(app);

module.exports = exports = app;
