'use strict';

(function(d3, rx) {

  // init
  var width = 640
    , height = 480;

  var animationStep = 400;

  var force1 = null, force2 = null
    , nodes1 = null, nodes2 = null
    , links1 = null, links2 = null;

  var svg = d3.select('body').append('svg')
    .attr('width', width)
    .attr('height', height);

  // A function to initialize our visualization.
  var initForce = function() {
    // clear out the contents of the SVG container
    // makes it possible to restart the layout without refreshing the page
    svg.selectAll('*').remove();

    // define the data
    var dataNodes1 = [
        { x: 4*width/10, y: 6*height/9 },
        { x: 6*width/10, y: 6*height/9 },
        { x:   width/2,  y: 7*height/9 },
        { x: 4*width/10, y: 7*height/9 },
        { x: 6*width/10, y: 7*height/9 },
        { x:   width/2,  y: 5*height/9 }
    ];

    var dataNodes2 = [
        { x: 4*width/10, y: 3*height/9 },
        { x: 6*width/10, y: 3*height/9 },
        { x:   width/2,  y: 2*height/9 },
        { x: 4*width/10, y: 2*height/9 },
        { x: 6*width/10, y: 2*height/9 },
        { x:   width/2,  y: 4*height/9 }
    ];

    var dataLinks1 = [
        { source: 0, target: 1},
        { source: 1, target: 2},
        { source: 2, target: 0}
    ];

    var dataLinks2 = [
        { source: 0, target: 1},
        { source: 1, target: 2},
        { source: 2, target: 0}
    ];

    //create a force layout object and define its properties
    force1 = d3.layout.force()
        .size([width, height])
        .nodes(dataNodes1)
        .links(dataLinks1);

    force2 = d3.layout.force()
        .size([width, height])
        .nodes(dataNodes2)
        .links(dataLinks2);

    force2.gravity(0);

    force1.linkDistance(height/2);
    force2.linkDistance(height/2);

    // add the nodes and links to the visualization
    links1 = svg.selectAll('.link1')
        .data(dataLinks1)
        .enter().append('line')
        .attr('class', 'link1')
        .attr('x1', function(d) { return dataNodes1[d.source].x; })
        .attr('y1', function(d) { return dataNodes1[d.source].y; })
        .attr('x2', function(d) { return dataNodes1[d.target].x; })
        .attr('y2', function(d) { return dataNodes1[d.target].y; });

    nodes1 = svg.selectAll('.node1')
        .data(dataNodes1)
        .enter().append('circle')
        .attr('class', 'node1')
        .attr('r', width/40)
        .attr('cx', function(d) { return d.x; })
        .attr('cy', function(d) { return d.y; });

      links2 = svg.selectAll('.link2')
        .data(dataLinks2)
        .enter().append('line')
        .attr('class', 'link2')
        .attr('x1', function(d) { return dataNodes2[d.source].x; })
        .attr('y1', function(d) { return dataNodes2[d.source].y; })
        .attr('x2', function(d) { return dataNodes2[d.target].x; })
        .attr('y2', function(d) { return dataNodes2[d.target].y; });

      nodes2 = svg.selectAll('.node2')
        .data(dataNodes2)
        .enter().append('circle')
        .attr('class', 'node2')
        .attr('r', width/40)
        .attr('cx', function(d) { return d.x; })
        .attr('cy', function(d) { return d.y; });

      force1.on('tick', stepForce1);
      force2.on('tick', stepForce2);
    };

    var stepForce1 = function() {
      if (force1.fullSpeed) {
         nodes1.attr('cx', function(d) { return d.x; })
              .attr('cy', function(d) { return d.y; });
      } else {
        nodes1.transition().ease('linear').duration(animationStep)
             .attr('cx', function(d) { return d.x; })
             .attr('cy', function(d) { return d.y; });
      }

      if (force1.fullSpeed) {
         links1.attr('x1', function(d) { return d.source.x; })
             .attr('y1', function(d) { return d.source.y; })
             .attr('x2', function(d) { return d.target.x; })
             .attr('y2', function(d) { return d.target.y; });
       } else {
         links1.transition().ease('linear').duration(animationStep)
             .attr('x1', function(d) { return d.source.x; })
             .attr('y1', function(d) { return d.source.y; })
             .attr('x2', function(d) { return d.target.x; })
             .attr('y2', function(d) { return d.target.y; });
       }
       if (!force1.fullSpeed) {
         force1.stop();
       }
       if (force1.slowMotion) {
         setTimeout(
             function() { force1.start(); },
             animationStep
         );
       }
    };

   var stepForce2 = function() {
     if (force2.fullSpeed) {
        nodes2.attr('cx', function(d) { return d.x; })
             .attr('cy', function(d) { return d.y; });
     } else {
       nodes2.transition().ease('linear').duration(animationStep)
            .attr('cx', function(d) { return d.x; })
            .attr('cy', function(d) { return d.y; });
     }

     if (force2.fullSpeed) {
        links2.attr('x1', function(d) { return d.source.x; })
            .attr('y1', function(d) { return d.source.y; })
            .attr('x2', function(d) { return d.target.x; })
            .attr('y2', function(d) { return d.target.y; });
      } else {
        links2.transition().ease('linear').duration(animationStep)
            .attr('x1', function(d) { return d.source.x; })
            .attr('y1', function(d) { return d.source.y; })
            .attr('x2', function(d) { return d.target.x; })
            .attr('y2', function(d) { return d.target.y; });
      }
      if (!force2.fullSpeed) {
        force2.stop();
      }
      if (force2.slowMotion) {
        setTimeout(
            function() { force2.start(); },
            animationStep
        );
      }
   };

  // the controls
  d3.select('#advance').on('click', function() {
    force1.start();
    force2.start();
  });

  d3.select('#slow').on('click', function() {
    force1.slowMotion = force2.slowMotion = true;
    force1.fullSpeed  = force2.fullSpeed  = false;
    force1.start();
    force1.start();
  });

  d3.select('#play').on('click', function() {
    force1.slowMotion = force2.slowMotion = false;
    force1.fullSpeed  = force2.fullSpeed  = true;
    force1.start();
    force2.start();
  });

  d3.select('#reset').on('click', function() {
    if (force1) {
        force1.stop();
    }
    if (force2) {
        force2.stop();
    }
    initForce();
  });

  initForce();

})(d3, Rx);
