'use strict';

var EventEmitter = require("events").EventEmitter
  ;

var tag = 'WINNER';

var winnerEmitter = new EventEmitter();

module.exports = {
  winnerEmitter: winnerEmitter
};
