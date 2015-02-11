'use strict';

(function d3andRxDemo(d3, rx) {

  // init
  var width = 960
    , height = 570;

  var animationStep = 400;

  var force = null
    , nodes = null
    , dataNodes = null
    , foci = null;

  var svg = d3.select('.content').append('svg')
    .attr('width', width)
    .attr('height', height);

  // A function to initialize our visualization.
  var initForce = function() {
    // clear out the contents of the SVG container
    // makes it possible to restart the layout without refreshing the page
    svg.selectAll('*').remove();

    foci = [ { x: 150, y: height - 50}  // Entrance
           , { x: 360, y: 245, id: 0}  // Red Hat Booth 1
           , { x: 640, y: 245, id: 1} // Red Hat Booth 2
           , { x: 100, y: 350, id: 2} // The Cube
           , { x: 340, y: 405, id: 3} // Room 207 SUMMIT Track
           , { x: 455, y: 405, id: 4} // Room 208 SUMMIT Track
           , { x: 560, y: 405, id: 5} // Room 209 SUMMIT Track
    ]

    // define the data
    dataNodes = [];

    //create a force layout object and define its properties
    force = d3.layout.force()
        .size([width, height])
        .nodes(dataNodes)
        .links([])
        .gravity(0)
        .charge(-5);

    nodes = svg.selectAll('.node')
        .data(dataNodes, function(datum, index) {
          datum.id;
        });

    force.on('tick', stepForce);
  };

  var stepForce = function(event) {
    var stepSize = .1;
    var k = stepSize * event.alpha;
     // Push nodes toward their designated focus.
    dataNodes.forEach(function(datum, i) {
      datum.y += (foci[datum.focus].y - datum.y) * k;
      datum.x += (foci[datum.focus].x - datum.x) * k;
    });

    nodes.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
  };


  var uniqueId = 0;
  var addNode = function(focus) {
    dataNodes.push({
        x:150
      , y:height
      , focus: focus
      , id: uniqueId++});
  };

  var moveNode = function(index, id) {
    var dataNode = dataNodes[index];
    dataNode.focus = id;
  };

  var removeNode = function(index) {
    dataNodes.splice(index, 1);
  };

  var renderNodes = function() {
    nodes = nodes.data(dataNodes, function(datum, index) {
      return datum.id;
    });
    nodes.enter().append("circle")
      .attr("class", function(d) { return 'node node' + d.focus} )
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .attr('r', 8);
    nodes.exit().remove();
  }

  // Returns a random integer between min included) and max (excluded)
  var getRandomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  var reset = Rx.Observable.fromEvent(d3.select('#reset').node(), 'click')
    , pause = Rx.Observable.fromEvent(d3.select('#pause').node(), 'click')
    , play = Rx.Observable.fromEvent(d3.select('#play').node(), 'click')
    , add = Rx.Observable.fromEvent(d3.select('#add').node(), 'click');

  var stop = Rx.Observable.merge(reset, pause);

  play.subscribe(function() {
    run();
  });

  add.subscribe(function() {
    addNode(getRandomInt(1, foci.length));
    force.start();
    renderNodes();
  });

  reset.subscribe(function() {
    if (force) {
        force.stop();
    }
    initForce();
    runSetup();
    run();
  });

  var runSetup = function() {
    var source = Rx.Observable
      .interval(1)
      .take(50)
      .takeUntil(stop)
      .map(function() {
        return getRandomInt(1, foci.length);
      });

    source.subscribe(function(focus) {
      addNode(focus);
      force.start();
      renderNodes();
    });
  }

  var run = function() {
    var source = Rx.Observable
      .interval(500)
      .take(500)
      .takeUntil(stop);

    var arrivals = source.filter(function() {
        return (dataNodes.length < 200);
      }).flatMap(function() {
        var max = getRandomInt(1,4);
        return Rx.Observable.range(0, max).map(function() {
          return getRandomInt(1, foci.length);
        });
      });

    var movements = source.flatMap(function() {
      var max = dataNodes.length < 20 ? 1 : 5;
      var num = getRandomInt(1, max + 1);
      return Rx.Observable.range(0, num).map(function() {
        var randomNodeIndex = getRandomInt(0, dataNodes.length);
        var focus = getRandomInt(1, foci.length);
        return {
          index: randomNodeIndex,
          focus: focus
        };
      });
    });

    var departures = source.filter(function() {
        return (dataNodes.length > 30);
      }).flatMap(function() {
        var max = getRandomInt(1,3);
        return Rx.Observable.range(0, max).map(function() {
          var randomNodeIndex = getRandomInt(0, dataNodes.length);
          return randomNodeIndex;
        });
      });

    arrivals.subscribe(function(focus) {
      addNode(focus);
      force.start();
      renderNodes();
    });

    movements.subscribe(function(movement) {
      moveNode(movement.index, movement.focus);
      force.start();
    });

    departures.subscribe(function(index) {
      removeNode(index);
      renderNodes();
      force.start();
    });

    force.start();
  };

  initForce();
  runSetup();
  run();
})(d3, Rx);
