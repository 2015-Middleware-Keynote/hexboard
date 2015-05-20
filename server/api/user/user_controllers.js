'use strict';

var user = require('./user');

module.exports = exports = {
  getAll: function(req, res, next) {
    res.json(user.getUsers());
  }
, getUser: function(req, res, next) {
    res.json(user.getUser(req.params.id));
  }
};
