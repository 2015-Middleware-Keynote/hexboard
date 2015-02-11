'use strict';

(function(d3, rx) {

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
    var stepSize = force.fullSpeed ? .1 : 0.01;
    var k = stepSize * event.alpha;
     // Push nodes toward their designated focus.
    dataNodes.forEach(function(o, i) {
      o.y += (foci[o.id].y - o.y) * k;
      o.x += (foci[o.id].x - o.x) * k;
    });

    nodes.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });

    if (!force.fullSpeed) {
      force.stop();
    }
    if (force.slowMotion) {
      setTimeout(
          function() { force.start(); },
          animationStep
      );
    }
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

  // the controls
  d3.select('#slow').on('click', function() {
    force.slowMotion = true;
    force.fullSpeed  = false;
    force.start();
  });

  d3.select('#play').on('click', function() {
    force.slowMotion = false;
    force.fullSpeed  = true;
    force.start();
  });

  d3.select('#add').on('click', function() {
    addNode(~~(Math.random() * foci.length));
    force.start();
    nodes = nodes.data(dataNodes);
    renderNodes(nodes);
  });

  d3.select('#reset').on('click', function() {
    if (force) {
        force.stop();
    }
    initForce();
  });

  initForce();

  force.slowMotion = false;
  force.fullSpeed  = true;
  force.start();

  var source = Rx.Observable
    .interval(1)
    .take(50);

  source.subscribe(function() {
    addNode(~~(Math.random() * foci.length));
    force.start();
    nodes = nodes.data(dataNodes);
    renderNodes(nodes);
  });

  var source = Rx.Observable
    .interval(500)
    .take(500);

  source.subscribe(function() {
    addNode(~~(Math.random() * foci.length));
    var max = ~~(Math.random() * Math.min(5, dataNodes.length - 20));
    for (var i=0; i <= max; i++) {
      var randomNodeIndex = ~~(Math.random() * dataNodes.length);
      moveNode(randomNodeIndex, ~~(Math.random() * foci.length));
    }
    force.start();
    nodes = nodes.data(dataNodes);
    renderNodes(nodes);
  });

})(d3, Rx);
