'use strict';

var Rx = require('rx')
  , EventEmitter = require("events").EventEmitter
  ;

var tag = 'THOUSAND';

// Returns a random integer between min included) and max (excluded)
var getRandomInt = function (min, max) {
  return Math.floor(Math.random() * (max - min) + min);
};

var randomEvents = Rx.Observable.range(0, 1026)
  .flatMap(function(index) {
    var delay = 0;
    return Rx.Observable.range(1, 4) // 5 states
      .flatMap(function(stage) {
        delay += getRandomInt(2000, 3000);
        return Rx.Observable.range(0,1)
          .map(function() {
            return {
              id: index
            , stage: stage
            };
          })
          .delay(delay);
      })
  })

var submissionCount = 0;

var randomDoodles = function(numDoodles) {
  var doodles = Rx.Observable.range(0, numDoodles)
    .flatMap(function(x) {
      var imageIndex = getRandomInt(0, 13);
      return Rx.Observable.range(0,1)
        .map(function() {
          var containerId = getRandomInt(0, 1026);
          var doodle = {
            containerId: containerId
          , url: '/thousand/doodles/thousand-doodle' + imageIndex + '.png'
          , name: 'FirstName' + containerId + ' LastName' + containerId
          , cuid: imageIndex
          , submissionId: submissionCount++
          };
          return doodle;
        })
        .delay(getRandomInt(0, 1000));
    });
  return doodles;
}

var doodleEmitter = new EventEmitter();

module.exports = {
  events: events
, randomDoodles: randomDoodles
, doodleEmitter: doodleEmitter
};
