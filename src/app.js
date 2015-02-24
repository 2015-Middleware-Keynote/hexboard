'use strict';

var d3demo = d3demo || {};

(function d3andRxDemo(d3, Rx) {
  // init
  var width = d3demo.width
    , height = d3demo.height;

  var debugging = false;

  var animationStep = 400;

  var force = null
    , nodes = null
    , dataNodes = null
    , foci = null;

  var svg = d3.select('.map').append('svg')
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
        .charge(function(d) {
          return d.present ? -14 : -2;
        });

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
    dataNodes.forEach(function(d, i) {
      d.y += (foci[d.focus].y - d.y) * k;
      d.x += (foci[d.focus].x - d.x) * k;
    });

    var now = new Date().getTime();

    nodes.attr("cx", function(d) { return d.x; })
         .attr("cy", function(d) { return d.y; })
         .attr('r', function(d) { return d.present ? 8 : 3})
         .style('fill', function(d) {
           if (d.present) {
             return getColor(now - d.checkInTimeInternal);
           } else {
             return getColor(d.checkOutTimeInternal - d.checkInTimeInternal);
           }
         });
  };

  var getColor = function(temp) {
    var hue = 270/(temp/1000 + 1);
    var color = 'hsl(' + [Math.floor(hue), '70%', '50%'] + ')'
    return color;
  };

  var findNodeById = function(nodeList, id) {
    var index = -1;
    for (var i = 0; i < nodeList.length; i++) {
      if (id === nodeList[i].id) {
        index = i;
        break;
      }
    }
    return index;
  };

  var addNode = function(arrival) {
    var newNode = {
      id: arrival.user.id,
      x: d3demo.getRandomInt(d3demo.locations[0].x - 50, d3demo.locations[0].x + 50),
      y: d3demo.getRandomInt(height, height + 50),
      focus: arrival._focus,
      present: arrival.scanner.type === 'check-in',
      user: arrival.user,
      checkInTime: arrival.timestamp,
      checkInTimeInternal: new Date().getTime()
    }
    dataNodes.push(newNode);
  };

  var moveNode = function(movement) {
    var dataNode = dataNodes[movement._index];
    dataNode.present = true;
    dataNode.exiting = false;
    dataNode.focus = movement._focus;
    dataNode.checkInTime = movement.timestamp;
    dataNode.checkInTimeInternal = new Date().getTime();
    dataNode.checkOutTime = null;
  };

  var removeNode = function(departure) {
    var dataNode = dataNodes[departure._index];
    if (dataNode.exiting) {
      debugging && console.log('Node already exiting, ignoring secondary exit call:' + departure.user.id);
      return;
    }
    dataNode.focus = 0;
    dataNode.present = true;
    dataNode.exiting = true;
    setTimeout(function() {
      var currentIndex = findNodeById(dataNodes, dataNode.id);
      if (currentIndex >= 0 && dataNodes[currentIndex].exiting === true) {
        dataNodes.splice(currentIndex, 1);
        force.start();
        renderNodes();
      } else {
        debugging && console.log('Node no longer available: ' + departure.user.id);
      }
    }, 1200);
  };

  var checkoutNode = function(checkout) {
    var dataNode = dataNodes[checkout._index];
    dataNode.present = false;
    dataNode.exiting = false;
    dataNode.checkOutTime = checkout.timestamp;
    dataNode.checkOutTimeInternal = new Date().getTime();
  };

  var renderNodes = function() {
    try {
      nodes = nodes.data(dataNodes, function(datum, index) {
        return datum.id;
      });
    } catch(e) {
      debugging && console.log(e);
    }
    nodes.enter().append("circle")
      .attr("class", 'node' )
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .attr('r', function(d) { return d.present ? 8 : 2});
    nodes.exit().remove();
  }

  var reset = Rx.Observable.fromEvent(d3.select('#reset').node(), 'click')
    , pause = Rx.Observable.fromEvent(d3.select('#pause').node(), 'click')
    , play = Rx.Observable.fromEvent(d3.select('#play').node(), 'click')
    , slow = Rx.Observable.fromEvent(d3.select('#slow').node(), 'click')
    , nodeClick = Rx.Observable.fromEvent(d3.select('.map').node(), 'click')
    ;

  var pauser = d3demo.pauser;
  var stop = Rx.Observable.merge(reset);

  play.subscribe(function() {
    pauser.onNext(true);
  });

  slow.subscribe(function() {
    pauser.onNext(true);
    clock.take(1).count().subscribe(function(event) {
      setTimeout(function() {
        pauser.onNext(false);
      }, 590);
    });
  })

  pause.subscribe(function() {
    pauser.onNext(false);
  });

  reset.subscribe(function() {
    pauser.onNext(false);
    if (force) {
      force.stop();
    }
    initForce();
    d3demo.resetUsers();
    run();
  });

  var checkInElement = (function() {
    var html = '<li class="check-out">'
      + '<span class="log-action"><i class="fa fa-sign-out"></i> Check-out</span>'
      + '<span class="log-time"><i class="fa fa-clock-o"></i></span>'
      + '<span class="log-id"><i class="fa fa-dot-circle-o"></i></span>'
      + '<span class="log-location"><i class="fa fa-map-marker"></i></span>'
    + '</li>';
    var documentFragment = document.createDocumentFragment();
    var element = document.createElement('div');
    element.innerHTML = html;
    documentFragment.appendChild(element.childNodes[0]);
    return documentFragment;
  })();

  var checkOutElement = (function() {
    var html = '<li class="check-in">'
      + '<span class="log-action"><i class="fa fa-sign-in"></i> Check-in</span>'
      + '<span class="log-time"><i class="fa fa-clock-o"></i></span>'
      + '<span class="log-id"><i class="fa fa-dot-circle-o"></i></span>'
      + '<span class="log-location"><i class="fa fa-map-marker"></i></span>'
    + '</li>';
    var documentFragment = document.createDocumentFragment();
    var element = document.createElement('div');
    element.innerHTML = html;
    documentFragment.appendChild(element.childNodes[0]);
    return documentFragment;
  })();

  var createMessageElement = function(scan) {
    // var baseNode = scan.type === 'check-in' ? checkInElement : checkOutElement;
    var baseNode = checkOutElement;
    var element = baseNode.cloneNode(true);
    var li = element.childNodes[0];
    li.childNodes[1].textContent = formatTime(scan.timestamp);
    li.childNodes[2].textContent = 'User ' + scan.user.id;
    li.childNodes[3].textContent = scan.scanner.location.name;
    return element;
  }

  var run = function(clock, source) {
    // a shared error handler
    var errorHandler = function (err) {
      console.log(err.stack);
    };

    // logging
    clock.subscribe(function(time) {
      document.getElementById('time').textContent = formatTime(time.timestamp);
    });

    var count = 0;
    var scrolling = false;
    var spans = [];
    var log = document.getElementById('log');
    source.subscribe(function(scan) {
      document.getElementById('interval').textContent = count++;
      document.getElementById('nodeCount').textContent = dataNodes.length;
      // var message = formatTime(scan.timestamp) + ': User '+ scan.user.id + ' ' + scan.scanner.type + ' at ' + scan.scanner.location.name;
      // console.log(message);
      spans.push(createMessageElement(scan));
      if (!scrolling) {
        scrolling = true;
        setTimeout(function() {
          // log.scrollTop = log.scrollHeight;
          spans.forEach(function(addSpan) {
            log.insertBefore(addSpan, log.firstChild);
            if (log.childNodes.length > 50) {
              log.removeChild(log.lastChild);
            }
          });
          spans = [];
          scrolling = false;
        }, 100);
      }
    }, errorHandler);

    var indexedScans = source.map(function(scan) {
      scan._index = findNodeById(dataNodes, scan.user.id);
      scan._focus = scan.scanner.location.id;
      return scan;
    })

    indexedScans.subscribe(function(scan) {
      if (scan._index < 0) {
        if (! (scan.scanner.type === 'check-out' && scan.scanner.location.id === 0)) {
          // ignore checkouts at the entrance if we are already not present
          addNode(scan);
        }
      } else {
        if (scan.scanner.type === 'check-in') {
          moveNode(scan);
        } else {
          if (scan.scanner.location.id !== 0) {
            checkoutNode(scan);
          } else {
            removeNode(scan);
          }
        }
      }
      force.start();
      renderNodes();
    }, errorHandler);

    force.start();
  };

  nodeClick.filter(function(event) {
    return event.target && event.target.nodeName === 'circle';
  })
  .subscribe(function(event) {
    svg.select('.selected').classed({selected: false});
    var node = d3.select(event.target);
    node.classed({selected: true});
    var data = node.data()[0];
    updateUserInfoPanel(data);
  });

  var updateUserInfoPanel = function(data) {
    var div = d3.select('.userinfo');
    div.style({'display': 'block'});
    debugging && console.log(data);
    div.select('.id_v').text(data.user.id);
    div.select('.name_v').text(data.user.name);
    div.select('.checkin_v').text(formatTime(data.checkInTime));
    div.select('.checkout_v').text(formatTime(data.checkOutTime));
  }

  var formatTime = function(time) {
    if (!time) {
      return "";
    }
    var date = new Date(time);
    var hours = date.getHours();
    var minutes = "0" + date.getMinutes();
    var seconds = "0" + date.getSeconds();

    // will display time in 10:30:23 format
    var formattedTime = hours + ':' + minutes.substr(minutes.length-2) + ':' + seconds.substr(seconds.length-2);
    return formattedTime;
  }

  initForce();
  d3demo.playback(run);
})(d3, Rx);
