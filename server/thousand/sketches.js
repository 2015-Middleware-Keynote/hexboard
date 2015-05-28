'use strict';

var Rx = require('rx')
  , _ = require('underscore')
  ;

  var sketches = _.range(1060).map(function(index) {
    return {
      id: index
    };
  });

  var clear = function() {
    sketches.forEach(function(item) {
      delete item.sketch;
    })
  };

  module.exports = {
    list : sketches
  , clear: clear
  };
