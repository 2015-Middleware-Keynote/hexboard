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

    foci = [ { x: 150, y: height}  // Entrance
           , { x: 360, y: 245, id: 0}  // Red Hat Booth 1
           , { x: 635, y: 245, id: 1} // Red Hat Booth 2
           , { x: 100, y: 350, id: 2} // The Cube
           , { x: 340, y: 400, id: 3} // Room 207 SUMMIT Track
           , { x: 455, y: 400, id: 4} // Room 208 SUMMIT Track
           , { x: 550, y: 400, id: 5} // Room 209 SUMMIT Track
    ]

    // define the data
    dataNodes = [];

    //create a force layout object and define its properties
    force = d3.layout.force()
        .size([width, height])
        .nodes(dataNodes)
        .links([])
        .gravity(0)
        .friction(0.83)
        .charge(-6);

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
         .attr("cy", function(d) { return d.y; })
         .attr('r', function(d) { return d.present ? 8 : 3});
  };


  var uniqueId = 0;
  var addNode = function(focus) {
    dataNodes.push({
        x:150
      , y:height
      , focus: focus
      , present: true
      , id: uniqueId++});
  };

  var moveNode = function(dataNode, id) {
    dataNode.present = true;
    dataNode.focus = id;
  };

  var removeNode = function(index) {
    var dataNode = dataNodes[index];
    dataNode.focus = 0;
    dataNode.present = true;
    setTimeout(function() {
      var currentIndex;
      for (var i = 0; i < dataNodes.length; i++) {
        if (dataNode.id === dataNodes[i].id) {
          currentIndex = i;
          break;
        }
      }
      dataNodes.splice(currentIndex, 1);
      force.start();
      renderNodes();
    }, 1000);
  };

  var checkoutNode = function(index) {
    var dataNode = dataNodes[index];
    dataNode.present = false;
  };

  var renderNodes = function() {
    nodes = nodes.data(dataNodes, function(datum, index) {
      return datum.id;
    });
    nodes.enter().append("circle")
      .attr("class", function(d) { return 'node node' + d.focus} )
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .attr('r', function(d) { return d.present ? 8 : 2});
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
    run();
  });

  var run = function() {
    var source = Rx.Observable
      .interval(500)
      .take(500)
      .takeUntil(stop);

    var count = 0;
    source.subscribe(function(x) {
      document.getElementById('interval').innerHTML = count++;
      document.getElementById('nodeCount').innerHTML = dataNodes.length;
    })

    var arrivals = source.filter(function() {
        return (dataNodes.length < 200);
      }).flatMap(function() {
        var num = dataNodes.length < 30 ? getRandomInt(30, 50) : getRandomInt(1,4);
        return Rx.Observable.interval(10).take(num).map(function() {
          return getRandomInt(1, foci.length);
        });
      });

    var movements = source.skip(5).flatMap(function() {
        var max = Math.min(dataNodes.length - 1, 5);
        var num = getRandomInt(1, max + 1);
        return Rx.Observable.range(0, num).map(function() {
          var checkedOut = dataNodes.filter(function(node) {
            return ! node.present;
          });
          if (! checkedOut.length) {
            return null;
          }
          var randomNodeIndex = getRandomInt(0, checkedOut.length);
          var focus = getRandomInt(1, foci.length);
          return {
            dataNode: checkedOut[randomNodeIndex],
            focus: focus
          };
        }).filter(function(entry) {
          return entry != null;
        });
      });

    var checkouts = source.skip(5).flatMap(function() {
        var max = Math.min(dataNodes.length - 1, 5);
        var num = getRandomInt(1, max + 1);
        return Rx.Observable.range(0, num).map(function() {
          var randomNodeIndex = getRandomInt(0, dataNodes.length);
          return randomNodeIndex;
        });
      });

    var departures = source.filter(function() {
        return (dataNodes.length > 30);
      }).flatMap(function() {
        var max = getRandomInt(0,2);
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
      moveNode(movement.dataNode, movement.focus);
      force.start();
      renderNodes();
    });

    checkouts.subscribe(function(index) {
      checkoutNode(index);
      force.start();
      renderNodes();
    });

    departures.subscribe(function(index) {
      removeNode(index);
    });

    force.start();
  };

  initForce();
  run();
})(d3, Rx);
