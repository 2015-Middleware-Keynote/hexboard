'use strict';

(function(d3, rx) {

  // init
  var width = 960
    , height = 500;

  var animationStep = 400;

  var force = null
    , nodes = null
    , dataNodes = null
    , foci = null;

  var svg = d3.select('body').append('svg')
    .attr('width', width)
    .attr('height', height);

  // A function to initialize our visualization.
  var initForce = function() {
    // clear out the contents of the SVG container
    // makes it possible to restart the layout without refreshing the page
    svg.selectAll('*').remove();

    foci = [
        { x:   width/3, y:   height/3, id: 0},
        { x: 2*width/3, y:   height/3, id: 1},
        { x:   width/2, y: 2*height/3, id: 2}
    ]

    // define the data
    dataNodes = [
        { x:   width/4, y:   height/4, id: 1},
        { x: 3*width/4, y:   height/4, id: 2},
        { x:   width/2, y: 3*height/4, id: 0}
    ];

    //create a force layout object and define its properties
    force = d3.layout.force()
        .size([width, height])
        .nodes(dataNodes)
        .links([])
        .gravity(0);

    nodes = svg.selectAll('.node')
        .data(dataNodes)
        .enter().append('circle')
        .attr('class', function(d) { return 'node node' + d.id; })
        .attr('r', width/25)
        .attr('cx', function(d) { return d.x; })
        .attr('cy', function(d) { return d.y; });

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

  // the controls
  d3.select('#advance').on('click', function() {
    force.start();
  });

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

  d3.select('#reset').on('click', function() {
    if (force) {
        force.stop();
    }
    initForce();
  });

  initForce();

})(d3, Rx);
