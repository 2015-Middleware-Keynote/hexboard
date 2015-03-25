'use strict';

var express = require('express');
var app = express();
var routers = {};
var apiRouter = express.Router();
routers.apiRouter = apiRouter;

require('./config.js')(app, express, routers);
require('../api/api_routes.js')(apiRouter);

module.exports = exports = app;
