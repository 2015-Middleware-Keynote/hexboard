'use strict';

var thousand = thousand || {};

thousand.layout = (function dataSimulator(d3, Rx) {

  var svg = d3.select('.map');

  var dataNodes = [];

  for (var i = 0; i < 1024; i++) {
    dataNodes.push({
      id: i
    , stage: 0
    , x: Math.floor(i % 64) * 15
    , y: Math.floor(i / 64) * 20
    });
  };

  var myMouseoverFunction = function() {
    var container = d3.select(this);
    container.datum().stage = (container.datum().stage + 1) % 4;
    container.datum().flipped = !container.datum().flipped;
    cycle();
  }

  var containers;
  var cycle = function() {
    containers.classed('stage0', function(d) {return d.stage === 0});
    containers.classed('stage1', function(d) {return d.stage === 1});
    containers.classed('stage2', function(d) {return d.stage === 2});
    containers.classed('stage3', function(d) {return d.stage === 3});
    containers.classed('flipped', function(d) { return d.flipped });
  };

  containers = svg.selectAll('.flip-container')
    .data(dataNodes)
    .enter().append('div')
      .attr('class', 'flip-container')
      .on('mouseover', myMouseoverFunction);

  var flippers = containers.append('div')
    .attr('class', 'flipper');

  flippers.append('div')
        .attr('class', 'node front');

  flippers.append('div')
        .attr('class', 'node back');

  var flip = function(dataNode) {
    dataNode.stage = (dataNode.stage + 1) % 4;
    dataNode.flipped = !dataNode.flipped;
  }

  Rx.Observable.interval(50).map(function(index) {
    var count = index % 256;
    flip(dataNodes[count]);
    flip(dataNodes[count+256]);
    flip(dataNodes[count+512]);
    flip(dataNodes[count+768]);
    cycle();
  }).take(10000).subscribe();

})(d3, Rx);
