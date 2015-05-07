'use strict';

var Rx = require('rx')
  , EventEmitter = require("events").EventEmitter
  ;

var tag = 'THOUSAND';

// Returns a random integer between min included) and max (excluded)
var getRandomInt = function (min, max) {
  return Math.floor(Math.random() * (max - min) + min);
};

var events2 = Rx.Observable.range(0, 1026)
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

var images = ['box-cartone.png', 'cherries.png', 'fairy.png', 'johnny-automatic-skateboard.png', 'kick-scouter3.png', 'papaya.png', 'paratrooper.png', 'Segelyacht.png', 'TheStructorr-cherries.png', 'unicycle.png'];
var doodles = Rx.Observable.range(0, 200)
  .flatMap(function(x) {
    return Rx.Observable.range(0,1)
      .map(function() {
        var containerId = getRandomInt(0, 1026);
        var doodle = {
          containerId: containerId
        , url: '/thousand/doodles/' + images[getRandomInt(0, images.length)]
        , name: 'FirstName' + containerId + ' LastName' + containerId
        };
        return doodle;
      })
      .delay(getRandomInt(0, 10000));
  });

var randomDoodles = function(numDoodles) {
  var images = ['box-cartone.png', 'cherries.png', 'fairy.png', 'johnny-automatic-skateboard.png', 'kick-scouter3.png', 'papaya.png', 'paratrooper.png', 'Segelyacht.png', 'TheStructorr-cherries.png', 'unicycle.png'];
  var doodles = Rx.Observable.range(0, numDoodles)
    .flatMap(function(x) {
      return Rx.Observable.range(0,1)
        .map(function() {
          var containerId = getRandomInt(0, 1026);
          var doodle = {
            containerId: containerId
          , url: '/thousand/doodles/' + images[getRandomInt(0, images.length)]
          , name: 'FirstName' + containerId + ' LastName' + containerId
          };
          return doodle;
        })
        .delay(getRandomInt(0, 1000));
    });
  return doodles;
}

var doodleEmitter = new EventEmitter();

module.exports = {
  events: events2
, doodles: doodles
, randomDoodles: randomDoodles
, doodleEmitter: doodleEmitter
};
