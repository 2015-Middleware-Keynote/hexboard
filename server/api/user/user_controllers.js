'use strict';

var users = [];
// initialize the users
for (var i = 0; i < 200; i++) {
  users.push({
    id: i
  , name: i === 13 ? 'Burr Sutter' : 'Firstname' + i + ' Lastname' + i
  });
};

module.exports = exports = {
  getAll: function(req, res, next) {
    res.json(users);
  }
, getUser: function(req, res, next) {
    res.json(users[req.params.id]);
  }
};
