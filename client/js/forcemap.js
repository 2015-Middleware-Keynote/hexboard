'use strict';

var d3demo = d3demo || {};

d3demo.forcemap = (function visualisation(d3, Rx) {
  // init
  var width = d3demo.layout.width
    , height = d3demo.layout.height;

  var animationStep = 400;

  var force = null
    , nodes = null
    , dataNodes
    , foci = null;

  var svg = d3.select('.map').append('svg')
    .attr('width', width)
    .attr('height', height);

  document.addEventListener('mapresize', function(e) {
    svg.attr('width', e.detail.width)
       .attr('height', e.detail.height);
  })

  // Returns a random integer between min included) and max (excluded)
  var getRandomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  };

  var getColor = function(temp) {
    var hue = 270/(temp/1000 + 1);
    var color = 'hsl(' + [Math.floor(hue), '70%', '50%'] + ')'
    return color;
  };

  // A function to initialize our visualization.
  var init = function() {
    // clear out the contents of the SVG container
    // makes it possible to restart the layout without refreshing the page
    svg.selectAll('*').remove();

    foci = d3demo.layout.locations;

    // define the data
    dataNodes = [];
    d3demo.playback.users.forEach(function(user) {
      var x = getRandomInt(foci[0].x - 10, foci[0].x + 10)
        , y = getRandomInt(height+50, height + 300);
      // x = 200, y= 200;
      var newNode = {
        id: user.id,
        x: x,
        y: y,
        x_i: x,
        y_i: y,
        focus: -1,
        present: false,
        user: user
      }
      dataNodes[user.id] = newNode;
    })

    //create a force layout object and define its properties
    force = d3.layout.force()
        .size([width, height])
        .nodes(dataNodes)
        .links([])
        .gravity(0)
        .friction(0.83)
        .charge(function(d) {
          return d.focus === -1
            ? 0
            : d.selected
              ? d.present ? -100 : -40
              : d.present ? -14 : -2;
        });

    nodes = svg.selectAll('circle')
        .data(dataNodes, function(datum, index) {
          return datum.id;
        })
        .enter().append("circle")
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; })
          .attr('r', function(d) { return d.present ? 8 : 2});

    force.on('tick', stepForce);
  };

  var stepForce = function(event) {
    var stepSize = .1;
    var k = stepSize * event.alpha;
    // Push nodes toward their designated focus.
    var now = new Date().getTime();
    dataNodes.forEach(function(d, i) {
      if (d.exiting) {
        if (now - d.checkOutTimeInternal > 1000) {
          d.exiting = false;
          d.present = false;
          d.focus = -1;
        }
      }
      var x = d.focus === -1 ? d.x_i : foci[d.focus].x
        , y = d.focus === -1 ? d.y_i : foci[d.focus].y
      d.y += (y - d.y) * k;
      d.x += (x - d.x) * k;
    });

    nodes.attr("cx", function(d) { return d.x; })
         .attr("cy", function(d) { return d.y; })
         .attr('r', function(d) {
           return d.selected
             ? d.present ? 20 : 14
             : d.present ? 8 : 3;
          })
         .style('fill', function(d) {
           if (d.present) {
             return getColor(now - d.checkInTimeInternal);
           } else {
             return getColor(d.checkOutTimeInternal - d.checkInTimeInternal);
           }
         })
         .classed('node', function(d) {
           return d.focus !== -1;
         });

  };

  var start = function() {
    force.start();
  }

  var getNodeById = function(id) {
   return nodes.filter(function(d) {
     return d.user.id == id;
   });
  };

  var getDataNodeById = function(id) {
   return dataNodes[id];
  };

  var getNodesByName = function(str) {
    return nodes.filter(function(d) {
      return d.user.name.toLowerCase().indexOf(str.toLowerCase()) > -1;
    });
  };

  var getSelectedNodes = function() {
    return svg.selectAll('.selected');
  };

  var getNodeCount = function() {
    return dataNodes.filter(function(d) {
      return d.focus !== -1;
    }).length;
  }

  return {
    init: init
  , start: start
  , getNodeById: getNodeById
  , getDataNodeById: getDataNodeById
  , getNodesByName: getNodesByName
  , getSelectedNodes: getSelectedNodes
  , getNodeCount: getNodeCount
  };
})(d3, Rx);
