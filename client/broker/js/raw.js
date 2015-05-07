'use strict';

var rawfeed = rawfeed || {};

d3demo.layout = (function dataSimulator(d3, Rx) {

  var display = {
    x: Math.max(document.documentElement.clientWidth, window.innerWidth) || 1920
  , y: Math.max(document.documentElement.clientHeight, window.innerHeight) - 4 - 39
  };

  var margin = {top: 50, right: 0, bottom: 0, left: 0};

  var  width = display.x - margin.left - margin.right
   ,  height = display.y - margin.top - margin.bottom;

  var diagram = d3.select('.diagram');

  diagram.style({'top': (height + margin.top - diagram.node().clientHeight) / 4 + 'px' });

  var box0 = document.querySelector('.amq').getBoundingClientRect()
  box0.x0 = box0.left;
  box0.x1 = box0.right;
  box0.y0 = box0.top - margin.top;
  box0.y1 = box0.bottom - margin.top;
  box0.cx = box0.x0 + box0.width  / 2;
  box0.cy = box0.y0 + box0.height / 2;

  var box1 = document.querySelector('.spark .gears').getBoundingClientRect()
  box1.x0 = box1.left;
  box1.x1 = box1.right;
  box1.y0 = box1.top - margin.top;
  box1.y1 = box1.bottom - margin.top;
  box1.cx = box1.x0 + box1.width / 2;
  box1.cy = box1.y0 + box1.height / 2;

  var svg = d3.select('.map').append('svg')
    .attr('width', width)
    .attr('height', height);

  function particleIn(index) {
    var offset = getRandomInt(0, 100);
    var start = {x: -10, y: 50 + offset * height / 100};
    var particle = svg.insert('circle')
        .datum({index: index, position: start, offset: offset})
        .attr('cx', start.x)
        .attr('cy', start.y)
        .attr('r', 20)
        .style('stroke', 'steelblue')
        .style('stroke-opacity', 1);
    particle.transition()
        .duration(1000)
        .ease('linear')
        .attr('cx', box0.x0)
        .attrTween('cy', function(d, i, a) {
          var ease = d3.ease('quad-out');
          var y0 = parseInt(a);
          var y1 = box0.y0 + 40 + y0 / height * 150;
          return function(t) {
            return y0 + ease(t)*(y1-y0);
          };
        })
        .attr('r', 5)
        .style('stroke-opacity', .4)
      .transition()
          .duration(1000)
          .ease('linear')
          .attrTween('cx', function(d, i, a) {
            var offset = 1.5 * d.offset - 125;
            return function(t) {
              var a = 0.80;
              return (box1.x0 - (t-1)*offset - 5) * (a + (1-a) * Math.cos(2*Math.PI*t))
            };
          })
          .attrTween('cy', function(d, i, a) {
            var ease = d3.ease('quad-out');
            var y0 = box0.y1 + 10;
            var y1 = box1.y0 + 20 + 1.5 * d.offset;
            return function(t) {
              return y0 + ease(t)*(y1-y0);
            };
          })
          .attrTween('r', function(d, i, a) {
            return d3.interpolate(5, 5);;
          })
          .styleTween('stroke-opacity', function(d, i, a) {
            return d3.interpolate(.6, .8);
          })
      .remove()
  };

  function particleOut(event) {
    console.log(event);
    var offset = getRandomInt(0, 100);
    var start = {
      x: box1.x1,
      // y: box1.y1 - offset / 2 - 75
      y: box1.y1 - 100 + 0.8 * (offset - 50)
    }
    svg.insert('circle')
        .datum({event: event, offset: offset})
        .attr('cx', start.x)
        .attr('cy', start.y)
        .attr('r', function(d) {return d.event.retransmit ? 5 : 10;})
        .style('stroke', function(d) {return d.event.retransmit ? 'orange' : d.event.type === 'check-in' ? 'green': '#ce0000';})
        .style('fill', function(d) {return d.event.retransmit ? 'orange' : d.event.type === 'check-in' ? 'green': '#ce0000';})
        .style('stroke-opacity', 1)
      .transition()
          .duration(1000)
          .ease('linear')
          .attrTween('cx', function(d, i, a) {
            var offset = -1.5 * d.offset;
            return function(t) {
              var a = 1.15;
              return (box1.x1 - t*offset) * (a + (1-a) * Math.cos(2*Math.PI*t))
            };
          })
          .attrTween('cy', function(d, i, a) {
            var ease = d3.ease('quad-in');
            var y0 = start.y;
            var y1 = box0.y1;
            return function(t) {
              return y0 + ease(t)*(y1-y0);
            };
          })
          .styleTween('stroke-opacity', function(d, i, a) {
            return d3.interpolate(.8, 1);
          })
          // .attr('r', 1)
      .transition()
          .duration(1000)
          .ease('linear')
          .attrTween('cx', function(d, i, a) {
            var x0 = box0.x1;
            var x1 = width;
            return d3.interpolate(x0, x1);
          })
          .attrTween('cy', function(d, i, a) {
            var ease = d3.ease('quad-out');
            var y0 = box0.cy + 0.2 * (d.offset - 50);
            var y1 = box0.cy + 1.5 * (d.offset - 50);
            return function(t) {
              return y0 + ease(t)*(y1-y0);
            };
          })
          // .attr('r', 1)
          .style('stroke-opacity', 1)
          .remove();
  };

  // Returns a random integer between min included) and max (excluded)
  var getRandomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  };

  var interval;
  var beaconEventsCount = 0;
  var beaconEventsProcessedCount = 0;

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
    return message.type === 'enqueueCount';
  }).tap(function(message) {
    switch(message.data.topic) {
      case 'beaconEvents':
        beaconEventsCount += message.data.count;
        window.requestAnimationFrame(function() {
          d3.select('.amq-input .count').text(numeral(beaconEventsCount).format('0,0'));
          d3.select('.amq-input .dirty').style({visibility: 'hidden'});
        });
        break;
      case 'beaconEventsProcessed':
        beaconEventsProcessedCount += message.data.count;
        window.requestAnimationFrame(function() {
          d3.select('.amq-output .count').text(numeral(beaconEventsProcessedCount).format('0,0'));
          d3.select('.amq-output .dirty').style({visibility: 'hidden'});
        });
        break;
    };
  })
  .subscribeOnError(function(err) {
    console.log(err);
  });

  feed.filter(function(message) {
    return message.type === 'beaconEvents'
  }).flatMap(function(message) {
    beaconEventsCount += message.data.num;
    return Rx.Observable.range(0, message.data.num).flatMap(function(x2) {
      var index = message.data.num * message.data.x + x2;
      var delay = Math.floor(message.data.interval * x2 / message.data.num);
      return Rx.Observable.from([index]).delay(delay);
    })
  })
  .tap(function(index) {
    particleIn(index);
  })
  .filter(function(index) {
    return index % 50 === 0
  }).tap(function(index) {
    window.requestAnimationFrame(function() {
      d3.select('.amq-input .count').text(numeral(beaconEventsCount).format('0,0'));
    });
  })
  .subscribeOnError(function(err) {
    console.log(err);
  });

  feed.filter(function(message) {
    return message.type === 'beaconEventsProcessed';
  })
  .flatMap(function(message) {
    return Rx.Observable.from(message.data.messages).flatMap(function(event, x2) {
      var delay = Math.floor(message.data.interval * x2 / message.data.num) * 4;
      return Rx.Observable.from([event]).delay(delay);
    })
  })
  .tap(function(event) {
    particleOut(event);
    beaconEventsProcessedCount++;
    window.requestAnimationFrame(function() {
      d3.select('.amq-output .count').text(numeral(beaconEventsProcessedCount).format('0,0'));
    });
  })
  .subscribeOnError(function(err) {
    console.log(err.stack ? err.stack : err);
  });

})(d3, Rx);
