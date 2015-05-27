var Rx = require('rx')
  , cc           = require('config-multipaas')
  , fs       = require('fs')
  , request = require('request')
  ;

var tag = 'THOUSAND';
var pod_statuses = []
var submissionCount = 0;

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

var randomSketches = function(numSketches) {
  var sketches = Rx.Observable.range(0, numSketches)
    .flatMap(function(x) {
      var imageIndex = getRandomInt(0, 13);
      return Rx.Observable.range(0,1)
        .map(function() {
          var containerId = getRandomInt(0, 1026);
          var sketch = {
            containerId: containerId
          , url: '/thousand/sketches/thousand-sketch' + imageIndex + '.png'
          , name: 'FirstName' + containerId + ' LastName' + containerId
          , cuid: imageIndex
          , submissionId: submissionCount++
          };
          return sketch;
        })
        .delay(getRandomInt(0, 1000));
    });
  return sketches;
}


module.exports = {
  events : randomEvents
, randomSketches: randomSketches
};
