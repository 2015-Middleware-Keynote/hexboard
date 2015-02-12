'use strict';

var d3demo = d3demo || {};

(function d3andRxDemo(d3, Rx) {
  // init
  var width = d3demo.width
    , height = d3demo.height;

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

    foci = d3demo.locations.map(function(location) {
      return {x: location.x, y: location.y};
    });

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

  var findNodeById = function(nodeList, id) {
    var index = -1;
    for (var i = 0; i < dataNodes.length; i++) {
      if (id === dataNodes[i].id) {
        index = i;
        break;
      }
    }
    return index;
  };

  var addNode = function(arrival) {
    dataNodes.push({
        x:150
      , y:height
      , focus: arrival.focus
      , present: true
      , id: arrival.id});
  };

  var moveNode = function(movement) {
    var index = findNodeById(dataNodes, movement.id);
    if (index >= 0) {
      var dataNode = dataNodes[index];
      dataNode.present = true;
      dataNode.focus = movement.focus;
    } else {
      console.log('Unable to move node: ' + movement.id);
    };
  };

  var removeNode = function(departure) {
    var index = findNodeById(dataNodes, departure.id);
    if (index >= 0) {
      var dataNode = dataNodes[index];
      dataNode.focus = 0;
      dataNode.present = true;
      dataNode.id += new Date().getTime(); // a unique id in case user comes back
      setTimeout(function() {
        var currentIndex = findNodeById(dataNodes, dataNode.id);
        if (currentIndex >= 0) {
          dataNodes.splice(currentIndex, 1);
          force.start();
          renderNodes();
        } else {
          console.log('Node no longer available: ' + departure.id);
        }
      }, 1200);
    } else {
      console.log('Unable to remove node: ' + departure.id);
    };
  };

  var checkoutNode = function(checkout) {
    var index = findNodeById(dataNodes, checkout.id);
    if (index >= 0) {
      dataNodes[index].present = false;
    } else {
      console.log('Unable to check-out node: ' + checkout.id);
    };
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

  var reset = Rx.Observable.fromEvent(d3.select('#reset').node(), 'click')
    , pause = Rx.Observable.fromEvent(d3.select('#pause').node(), 'click')
    , play = Rx.Observable.fromEvent(d3.select('#play').node(), 'click')
    , add = Rx.Observable.fromEvent(d3.select('#add').node(), 'click');

  var stop = Rx.Observable.merge(reset, pause);

  play.subscribe(function() {
    run();
  });

  reset.subscribe(function() {
    if (force) {
        force.stop();
    }
    initForce();
    run();
  });

  var run = function() {
    var source = d3demo.source.take(1000).takeUntil(stop).publish();

    var errorHandler = function (err) {
      console.log(err.stack);
    };

    var count = 0;
    source.subscribe(function(event) {
      document.getElementById('interval').innerHTML = count++;
      document.getElementById('nodeCount').innerHTML = dataNodes.length;
      var message = 'User '+ event.user.id + ' ' + event.scanner.type + ' at ' + event.scanner.location.name;
      var log = document.getElementById('log');
      var span = document.createElement("span");
      span.className = event.scanner.type;
      span.textContent = message;
      log.appendChild(span);
      log.scrollTop = log.scrollHeight;
    }, errorHandler);

    var arrivals = source.filter(function(event) {
      return event.user.lastScanner == null;
    }).map(function(event) {
      return {
        id: event.user.id,
        focus: event.user.scanner.location.id
      };
    });

    var movements = source.filter(function(event) {
      return event.user.lastScanner != null && event.scanner.type === 'check-in';
    }).map(function(event) {
      return {
        id: event.user.id,
        focus: event.user.scanner.location.id
      };
    });

    var checkouts = source.filter(function(event) {
      return event.scanner.type === 'check-out' && event.scanner.location.id !== 0;
    }).map(function(event) {
      return {
        id: event.user.id,
        focus: event.user.scanner.location.id
      };
    });

    var departures = source.filter(function(event) {
        return event.scanner.type === 'check-out' && event.scanner.location.id === 0;
      }).map(function(event) {
        return {
          id: event.user.id
        };
      });

    arrivals.subscribe(function(arrival) {
      addNode(arrival);
      force.start();
      renderNodes();
    }, errorHandler);

    movements.subscribe(function(movement) {
      moveNode(movement);
      force.start();
      renderNodes();
    });

    checkouts.subscribe(function(checkout) {
      checkoutNode(checkout);
      force.start();
      renderNodes();
    }, errorHandler);

    departures.subscribe(function(departure) {
      removeNode(departure);
    }, errorHandler);

    source.connect();

    force.start();
  };

  initForce();
  run();
})(d3, Rx);
