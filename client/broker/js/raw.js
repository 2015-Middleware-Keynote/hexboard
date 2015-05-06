'use strict';

var rawfeed = rawfeed || {};

d3demo.layout = (function dataSimulator(d3, Rx) {

  var display = {
    x: Math.max(document.documentElement.clientWidth, window.innerWidth) || 1920
  , y: Math.max(document.documentElement.clientHeight, window.innerHeight) - 4 - 39
  };

  var margin = {top: 0, right: 0, bottom: 0, left: 0};

  var  width = display.x - margin.left - margin.right
   ,  height = display.y - margin.top - margin.bottom;

  var box0 = {
    x0: width / 4,
    y0: height/4 - height / 8,
    width: width / 2,
    height: height/4
  };
  box0.x1 = box0.x0 + box0.width;
  box0.y1 = box0.y0 + box0.height;
  box0.cx = box0.x0 + box0.width  / 2;
  box0.cy = box0.y0 + box0.height / 2;

  var box1 = {
    x0: width / 2 - width / 16,
    y0: 3 * height/4 - height / 8 - 50,
    width: width / 8,
    height: height /4
  }
  box1.x1 = box1.x0 + box1.width;
  box1.y1 = box1.y0 + box1.height;
  box1.cx = box1.x0 + box1.width / 2;
  box1.cy = box1.y0 + box1.height / 2;

  var svg = d3.select('.map').append('svg')
    .attr('width', width)
    .attr('height', height);

  function particle(index, start) {
    var particle = svg.insert('circle')
        .datum({index: index, position: start})
        .attr('cx', start.x)
        .attr('cy', start.y)
        .attr('r', 20)
        .style('stroke', 'red')
        .style('stroke-opacity', 1);
    particle.transition()
        .duration(1000)
        .ease('linear')
        .attr('cx', box0.x0 + getRandomInt(-10, 0))
        .attrTween('cy', function(d, i, a) {
          var ease = d3.ease('quad-out');
          var y0 = parseInt(a);
          var y1 = box0.y0 + 20 + getRandomInt(0, 200);
          return function(t) {
            return y0 + ease(t)*(y1-y0);
          };
        })
        .attr('r', 10)
        .style('stroke-opacity', .8)
      .transition()
          .duration(1000)
          .ease('linear')
          .attrTween('cx', function(d, i, a) {
            var offset = getRandomInt(-200, 0);
            return function(t) {
              var a = 0.80;
              return (box1.x0 - (t-1)*offset - 5) * (a + (1-a) * Math.cos(2*Math.PI*t))
            };
          })
          .attrTween('cy', function(d, i, a) {
            var ease = d3.ease('quad-out');
            var y0 = box0.y1 + getRandomInt(5, 15);
            var y1 = box1.y0 + 20 + getRandomInt(0, 200);
            return function(t) {
              return y0 + ease(t)*(y1-y0);
              // return y0  + (y1-y0) * (1/Math.sin(Math.PI*t));
            };
          })
          .attr('r', 5)
          .style('stroke-opacity', .8)
      .remove()
    .filter(function(d, i) { return d.index % 20 === 0; })
        .transition()
            .duration(1000)
            .each('start', function() {
              var text = d3.select('.amq-output .count');
              text.text(parseInt(text.text()) + 1);
            })
            .ease('linear')
            .attrTween('cx', function(d, i, a) {
              var offset = getRandomInt(-50, 0);
              return function(t) {
                var a = 1.15;
                return (box1.x1 - (t)*offset + 5) * (a + (1-a) * Math.cos(2*Math.PI*t))
              };
            })
            .attrTween('cy', function(d, i, a) {
              var ease = d3.ease('quad-in');
              var y0 = box1.y0 + getRandomInt(75, 125);
              var y1 = box0.y1 + getRandomInt(0, 10);
              return function(t) {
                return y0 + ease(t)*(y1-y0);
              };
            })
            .styleTween('stroke-opacity', function(d, i, a) {
              return d3.interpolate(.8, 1);
            })
            .attr('r', 1)
        .transition()
            .duration(1000)
            .ease('linear')
            .attrTween('cx', function(d, i, a) {
              var x0 = box0.x1 + getRandomInt(0, 10);
              var x1 = width;
              return d3.interpolate(x0, x1);
            })
            .attrTween('cy', function(d, i, a) {
              var ease = d3.ease('quad-out');
              var y0 = box0.cy + getRandomInt(-5, 5);
              var y1 = box0.cy + getRandomInt(-20, 20);
              return function(t) {
                return y0 + ease(t)*(y1-y0);
              };
            })
            .attr('r', 1)
            .style('stroke-opacity', 1)
            .remove();
  };

  // Returns a random integer between min included) and max (excluded)
  var getRandomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  };

  var interval;

  var feed = Rx.DOM.fromWebSocket(d3demo.config.backend.ws + '/broker')
  .map(function(message) {
    return JSON.parse(message.data);
  }).share();

  feed.filter(function(message) {
    return message.type === 'setup';
  }).tap(function(message) {
    interval = message.data.interval;
  }).take(1)
  .subscribeOnError(function(err) {
    console.log(err);
  });

  feed.filter(function(message) {
    return message.type === 'beaconEvents'
  }).flatMap(function(message) {
    return Rx.Observable.range(0, message.data.num).flatMap(function(x2) {
      var index = message.data.num * message.data.x + x2;
      var delay = getRandomInt(0, interval);
      return Rx.Observable.range(0,1)
        .map(function() {
          return index;
        })
        .delay(delay);
    })
  })
  .tap(function(index) {
    var start = {x: getRandomInt(0, 100), y: getRandomInt(0, height)};
    particle(index, start);
  }).take(100000)
  .filter(function(index) {
    return index % 50 === 0
  }).tap(function(index) {
    d3.select('.amq-input .count').text(index);
  }).subscribe();

})(d3, Rx);
