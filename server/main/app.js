'use strict';

var express = require('express')
  , app = express()
  , routers = {}
  , apiRouter = express.Router()
  ;

routers.apiRouter = apiRouter;

require('./config.js')(app, express, routers);
require('./routes.js')(apiRouter);

module.exports = exports = app;
