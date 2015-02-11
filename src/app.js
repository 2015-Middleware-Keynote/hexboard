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

    foci = [ { x: 360, y: 245, id: 0}  // Red Hat Booth 1
           , { x: 640, y: 245, id: 1} // Red Hat Booth 2
           , { x: 100, y: 350, id: 2} // The Cube
           , { x: 340, y: 405, id: 3} // Room 207 SUMMIT Track
           , { x: 455, y: 405, id: 4} // Room 208 SUMMIT Track
           , { x: 560, y: 405, id: 5} // Room 209 SUMMIT Track
    ]

    // define the data
    dataNodes = [];

    addNode(0);
    addNode(1);
    addNode(2);

    //create a force layout object and define its properties
    force = d3.layout.force()
        .size([width, height])
        .nodes(dataNodes)
        .links([])
        .gravity(0)
        .charge(-5);

    // render any nodes initially present
    nodes = svg.selectAll('.node')
        .data(dataNodes);

    renderNodes(nodes);

    force.on('tick', stepForce);
  };

  var stepForce = function(event) {
    var stepSize = .1;
    var k = stepSize * event.alpha;
     // Push nodes toward their designated focus.
    dataNodes.forEach(function(o, i) {
      o.y += (foci[o.id].y - o.y) * k;
      o.x += (foci[o.id].x - o.x) * k;
    });

    nodes.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
  };

  var addNode = function(id) {
    dataNodes.push({x:150, y:height, id: id});
  };

  var moveNode = function(index, id) {
    var dataNode = dataNodes[index];
    dataNode.id = id;
  };

  var renderNodes = function(nodes) {
    nodes.enter().append("circle")
      .attr("class", function(d) { return 'node node'+d.id} )
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .attr('r', 8)
      .call(force.drag);
  }

  var getRandomIndex = function (length) {
    return getRandomInt(0, length -1);
  }

  // Returns a random integer between min and max (included)
  var getRandomInt = function (min, max) {
    max = max + 1;
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
    addNode(getRandomIndex(foci.length));
    force.start();
    nodes = nodes.data(dataNodes);
    renderNodes(nodes);
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
        return getRandomIndex(foci.length);
      });

    source.subscribe(function(focus) {
      addNode(focus);
      force.start();
      nodes = nodes.data(dataNodes);
      renderNodes(nodes);
    });
  }

  var run = function() {
    var source = Rx.Observable
      .interval(500)
      .take(500)
      .takeUntil(stop);

    var arrivals = source.flatMap(function() {
      var max = getRandomInt(1,3);
      return Rx.Observable.range(0, max).map(function() {
        return getRandomIndex(foci.length);
      });
    });

    var movements = source.flatMap(function() {
      var max = getRandomIndex(Math.min(5, dataNodes.length - 20));
      return Rx.Observable.range(0, max).map(function() {
        var randomNodeIndex = getRandomIndex(dataNodes.length);
        var focus = getRandomIndex(foci.length);
        return {
          index: randomNodeIndex,
          focus: focus
        };
      });
    });

    arrivals.subscribe(function(focus) {
      addNode(focus);
      force.start();
      nodes = nodes.data(dataNodes);
      renderNodes(nodes);
    });

    movements.subscribe(function(movement) {
      moveNode(movement.index, movement.focus);
      force.start();
    });

    force.start();
  };

  initForce();
  runSetup();
  run();
})(d3, Rx);
