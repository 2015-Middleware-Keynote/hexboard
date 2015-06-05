'use strict';

var express = require('express')
  , app = express()
  , routers = {}
  , apiRouter = express.Router()
  ;

routers.apiRouter = apiRouter;

require('./config.js')(app, express, routers);
require('../thousand/api/api_routes.js')(apiRouter);

module.exports = exports = app;
