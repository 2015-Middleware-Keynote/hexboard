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


  var svg = d3.select('.map').append('svg')
    .attr('width', width)
    .attr('height', height);

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

  function drawBoxes() {
    svg.insert('rect')
      .attr('class', 'jms')
      .attr('x', box0.x0)
      .attr('y', box0.y0)
      .attr('width',box0.width)
      .attr('height', box0.height);

    var spark = svg.insert('rect')
      .attr('class', 'jms')
      .attr('x', box1.x0)
      .attr('y', box1.y0)
      .attr('width', box1.width)
      .attr('height', box1.height);

    var scale = 2;
    var gears = svg.insert('g')
      .attr('class', 'gear')
      .attr('transform', 'matrix('+scale+', 0, 0, '+scale+', '+ (box1.cx - 100) +', '+ (box1.cy - 80) +')')
    var gearbox1 = gears.append('g');


    // gear source: http://commons.wikimedia.org/wiki/File:Noun_project_1063.svg
    gearbox1
      .append('path')
      .attr('d', 'm86.6 10.3v-0.1c-1.5-2-3.3-3.7-5.4-5.3v0.1c-1.7 1.3-3.4 2.7-5 4.1-0.7-0.4-1.3-0.7-1.9-1-0.8-0.4-1.6-0.8-2.5-1-0.3-0.1-0.6-0.2-0.9-0.2-0.2-2.2-0.4-4.4-0.7-6.6-1-0.2-2-0.2-3.1-0.3h-0.8-0.8c-1 0.1-1.9 0.1-2.8 0.3-0.3 2.1-0.5 4.3-0.6 6.5-0.4 0-0.7 0.1-1.1 0.2-0.1 0-0.2 0-0.3 0.1-0.8 0.2-1.6 0.6-2.4 1-0.7 0.3-1.3 0.6-1.9 1-1.7-1.4-3.3-2.7-5-4.1l-0.1-0.1c-0.4 0.3-0.8 0.6-1.1 0.9-0.7 0.5-1.3 1.1-1.8 1.7-0.9 0.8-1.6 1.8-2.4 2.8h0.1c1.3 1.7 2.7 3.3 4.1 5-0.4 0.6-0.8 1.3-1.1 1.9-0.4 0.8-0.7 1.7-0.9 2.5-0.2 0.4-0.3 0.8-0.3 1.1-2.2 0.2-4.4 0.4-6.5 0.7-0.2 1-0.3 2-0.3 3.1 0 1.5 0.1 3 0.4 4.4 2.1 0.2 4.2 0.4 6.4 0.6 0 0.4 0.1 0.8 0.3 1.1 0.2 0.9 0.5 1.7 0.9 2.6 0.4 0.7 0.7 1.4 1.2 2-1.4 1.7-2.8 3.3-4.1 5 1.5 2.1 3.3 3.9 5.4 5.4v-0.1c1.6-1.3 3.3-2.7 4.9-4.1h0.1c0.5 0.3 1.1 0.6 1.6 0.9 0.9 0.4 1.9 0.8 2.8 1 0.4 0.1 0.7 0.2 1 0.3 0.2 2.1 0.4 4.3 0.7 6.5 0.9 0.1 1.8 0.2 2.8 0.2h1.5c1.1 0 2.2-0.1 3.3-0.3 0.2-2.1 0.4-4.3 0.6-6.5 0.3-0.1 0.6-0.2 0.9-0.3 0.9-0.2 1.7-0.5 2.5-0.9 0.7-0.3 1.4-0.7 2.1-1.2 0 0.1 0 0.1 0.1 0.1 1.6 1.4 3.3 2.8 5 4.1 0.3-0.2 0.6-0.4 1-0.7 0.6-0.5 1.2-1.1 1.7-1.7 0.9-0.9 1.8-1.9 2.6-3-1.4-1.7-2.8-3.4-4.2-5v-0.1c0.3-0.5 0.6-1.1 0.9-1.7 0.3-0.8 0.7-1.6 0.9-2.4 0-0.1 0-0.2 0.1-0.2 0-0.4 0.1-0.7 0.2-0.9 2.2-0.2 4.4-0.4 6.5-0.6 0.2-1 0.2-2 0.3-3v-0.9-0.8c-0.1-1-0.1-2-0.3-3-2.1-0.2-4.3-0.4-6.5-0.6-0.1-0.3-0.2-0.6-0.2-0.9-0.3-0.9-0.6-1.8-1-2.7-0.3-0.6-0.7-1.3-1-1.9 1.3-1.6 2.7-3.3 4.1-5zm-26.7 8.3c1.8-1.9 4-2.8 6.5-2.7 2.6-0.1 4.7 0.8 6.6 2.7 1.8 1.8 2.7 4 2.7 6.5 0 2.6-0.9 4.7-2.7 6.6-1.9 1.8-4 2.7-6.6 2.7-2.5 0-4.7-0.9-6.5-2.7-1.8-1.9-2.7-4-2.7-6.6 0-2.5 0.9-4.7 2.7-6.5z')
      .append('animateTransform')
        .attr('attributeName', 'transform')
        .attr('type', 'rotate')
        .attr('from', '0 66.5 25')
        .attr('to', '360 66.5 25')
        .attr('dur', '3s')
        .attr('repeatCount', 'indefinite')
    gearbox1
      .append('path')
      .attr('d', 'm66.5 17.2c-2.2 0-4 0.8-5.6 2.3-1.5 1.6-2.3 3.4-2.3 5.6s0.8 4 2.3 5.6c1.6 1.6 3.4 2.4 5.6 2.4s4-0.8 5.6-2.4c1.6-1.6 2.3-3.4 2.3-5.6s-0.7-4-2.3-5.6c-1.6-1.5-3.4-2.3-5.6-2.3zm-4.2 3.7c1.2-1.1 2.6-1.7 4.2-1.7s3 0.6 4.2 1.7c1.2 1.2 1.7 2.5 1.7 4.2s-0.5 3.1-1.7 4.2c-1.2 1.2-2.6 1.8-4.2 1.8s-3-0.6-4.2-1.8c-1.1-1.1-1.7-2.5-1.7-4.2 0-1.6 0.6-3 1.7-4.2z');

    var gearbox2 = gears
      .append('g')
      .attr('transform', 'translate(-33, 33)');

    gearbox2
      .append('path')
      .attr('d', 'm86.6 10.3v-0.1c-1.5-2-3.3-3.7-5.4-5.3v0.1c-1.7 1.3-3.4 2.7-5 4.1-0.7-0.4-1.3-0.7-1.9-1-0.8-0.4-1.6-0.8-2.5-1-0.3-0.1-0.6-0.2-0.9-0.2-0.2-2.2-0.4-4.4-0.7-6.6-1-0.2-2-0.2-3.1-0.3h-0.8-0.8c-1 0.1-1.9 0.1-2.8 0.3-0.3 2.1-0.5 4.3-0.6 6.5-0.4 0-0.7 0.1-1.1 0.2-0.1 0-0.2 0-0.3 0.1-0.8 0.2-1.6 0.6-2.4 1-0.7 0.3-1.3 0.6-1.9 1-1.7-1.4-3.3-2.7-5-4.1l-0.1-0.1c-0.4 0.3-0.8 0.6-1.1 0.9-0.7 0.5-1.3 1.1-1.8 1.7-0.9 0.8-1.6 1.8-2.4 2.8h0.1c1.3 1.7 2.7 3.3 4.1 5-0.4 0.6-0.8 1.3-1.1 1.9-0.4 0.8-0.7 1.7-0.9 2.5-0.2 0.4-0.3 0.8-0.3 1.1-2.2 0.2-4.4 0.4-6.5 0.7-0.2 1-0.3 2-0.3 3.1 0 1.5 0.1 3 0.4 4.4 2.1 0.2 4.2 0.4 6.4 0.6 0 0.4 0.1 0.8 0.3 1.1 0.2 0.9 0.5 1.7 0.9 2.6 0.4 0.7 0.7 1.4 1.2 2-1.4 1.7-2.8 3.3-4.1 5 1.5 2.1 3.3 3.9 5.4 5.4v-0.1c1.6-1.3 3.3-2.7 4.9-4.1h0.1c0.5 0.3 1.1 0.6 1.6 0.9 0.9 0.4 1.9 0.8 2.8 1 0.4 0.1 0.7 0.2 1 0.3 0.2 2.1 0.4 4.3 0.7 6.5 0.9 0.1 1.8 0.2 2.8 0.2h1.5c1.1 0 2.2-0.1 3.3-0.3 0.2-2.1 0.4-4.3 0.6-6.5 0.3-0.1 0.6-0.2 0.9-0.3 0.9-0.2 1.7-0.5 2.5-0.9 0.7-0.3 1.4-0.7 2.1-1.2 0 0.1 0 0.1 0.1 0.1 1.6 1.4 3.3 2.8 5 4.1 0.3-0.2 0.6-0.4 1-0.7 0.6-0.5 1.2-1.1 1.7-1.7 0.9-0.9 1.8-1.9 2.6-3-1.4-1.7-2.8-3.4-4.2-5v-0.1c0.3-0.5 0.6-1.1 0.9-1.7 0.3-0.8 0.7-1.6 0.9-2.4 0-0.1 0-0.2 0.1-0.2 0-0.4 0.1-0.7 0.2-0.9 2.2-0.2 4.4-0.4 6.5-0.6 0.2-1 0.2-2 0.3-3v-0.9-0.8c-0.1-1-0.1-2-0.3-3-2.1-0.2-4.3-0.4-6.5-0.6-0.1-0.3-0.2-0.6-0.2-0.9-0.3-0.9-0.6-1.8-1-2.7-0.3-0.6-0.7-1.3-1-1.9 1.3-1.6 2.7-3.3 4.1-5zm-26.7 8.3c1.8-1.9 4-2.8 6.5-2.7 2.6-0.1 4.7 0.8 6.6 2.7 1.8 1.8 2.7 4 2.7 6.5 0 2.6-0.9 4.7-2.7 6.6-1.9 1.8-4 2.7-6.6 2.7-2.5 0-4.7-0.9-6.5-2.7-1.8-1.9-2.7-4-2.7-6.6 0-2.5 0.9-4.7 2.7-6.5z')
      .append('animateTransform')
        .attr('attributeName', 'transform')
        .attr('type', 'rotate')
        .attr('from', '20 66.5 25')
        .attr('to', '-340 66.5 25')
        .attr('dur', '3s')
        .attr('repeatCount', 'indefinite')
    gearbox2
      .append('path')
      .attr('d', 'm66.5 17.2c-2.2 0-4 0.8-5.6 2.3-1.5 1.6-2.3 3.4-2.3 5.6s0.8 4 2.3 5.6c1.6 1.6 3.4 2.4 5.6 2.4s4-0.8 5.6-2.4c1.6-1.6 2.3-3.4 2.3-5.6s-0.7-4-2.3-5.6c-1.6-1.5-3.4-2.3-5.6-2.3zm-4.2 3.7c1.2-1.1 2.6-1.7 4.2-1.7s3 0.6 4.2 1.7c1.2 1.2 1.7 2.5 1.7 4.2s-0.5 3.1-1.7 4.2c-1.2 1.2-2.6 1.8-4.2 1.8s-3-0.6-4.2-1.8c-1.1-1.1-1.7-2.5-1.7-4.2 0-1.6 0.6-3 1.7-4.2z');

    var spark = {
      x: 258, y: 137
    }

    svg.append('image')
      .attr('width', spark.x)
      .attr('height', spark.y)
      .attr('x', box1.cx - spark.x / 2)
      .attr('y', box1.y1+10)
      .attr('xlink:href', '/broker/img/spark-logo.png');

    var activemq = {
      x: 386, y: 114
    }

    svg.append('image')
      .attr('width', activemq.x)
      .attr('height', activemq.y)
      .attr('x', box0.cx - activemq.x / 2)
      .attr('y', box0.cy - activemq.y / 2)
      .attr('xlink:href', '/broker/img/activemq-logo.png');

    svg.append('text')
      .attr('class', 'topic')
      .attr('x', box0.x0 + 10)
      .attr('y', box0.y0 + 30)
      .text('/topic/beaconEvents');

    svg.append('text')
      .attr('id', 'beaconEvents')
      .attr('class', 'count')
      .attr('x', box0.x0 + 10)
      .attr('y', box0.cy + 10)
      .text('1432567');

      svg.append('text')
        .attr('class', 'topic')
        .attr('text-anchor', 'end')
        .attr('x', box0.x1 - 10)
        .attr('y', box0.y0 + 30)
        .text('/topic/beaconEvents_processed');

      svg.append('text')
        .attr('id', 'beaconEvents_processed')
        .attr('class', 'count')
        .attr('text-anchor', 'end')
        .attr('x', box0.x1 - 10)
        .attr('y', box0.cy + 10)
        .text('0');
  };

  drawBoxes();

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
              var text = d3.select(beaconEvents_processed);
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
    d3.select('#beaconEvents').text(index);
  }).subscribe();

})(d3, Rx);
