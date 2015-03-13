'use strict';

var d3demo = d3demo || {};

d3demo.visualisation = (function visualisation(d3, Rx) {
  // init
  var width = d3demo.layout.width
    , height = d3demo.layout.height;

  var debugging = false;

  var animationStep = 400;

  var force = null
    , nodes = null
    , dataNodes = null
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

  // A function to initialize our visualization.
  var initForce = function() {
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

  var getNodeById = function(id) {
    return nodes.filter(function(d) {
      return d.user.id == id;
    });
  };

  var getNodesByName = function(str) {
    return nodes.filter(function(d) {
      return d.user.name.toLowerCase().indexOf(str.toLowerCase()) > -1;
    });
  }

  var getColor = function(temp) {
    var hue = 270/(temp/1000 + 1);
    var color = 'hsl(' + [Math.floor(hue), '70%', '50%'] + ')'
    return color;
  };

  var checkinNode = function(movement) {
    var dataNode = dataNodes[movement.user.id];
    dataNode.present = true;
    dataNode.exiting = false;
    dataNode.focus = movement.location.id;
    dataNode.checkInTime = movement.timestamp;
    dataNode.checkInTimeInternal = new Date().getTime();
    dataNode.checkOutTime = null;
    if (dataNode.selected) {
      updateUserInfoPanel(dataNode);
    }
  };

  var checkoutNode = function(checkout) {
    var dataNode = dataNodes[checkout.user.id];
    dataNode.present = false;
    dataNode.exiting = false;
    dataNode.checkOutTime = checkout.timestamp;
    dataNode.checkOutTimeInternal = new Date().getTime();
    if (dataNode.selected) {
      updateUserInfoPanel(dataNode);
    }
  };

  var removeNode = function(departure) {
    var dataNode = dataNodes[departure.user.id];
    if (dataNode.focus < 0) { // already removed
      return;
    }
    if (dataNode.selected) {
      updateUserInfoPanel(dataNode);
    }
    dataNode.present = true;
    dataNode.exiting = true;
    dataNode.checkOutTimeInternal = new Date().getTime();
    dataNode.focus = 0;
  };

  var selectNodes = function(selectedNodes) {
    selectedNodes.data().forEach(function(d) {
      d.selected = true;
    });
    d3.timer(function() {
      selectedNodes.classed('selected', function(d) { return d.selected; });
      return true;
    });
    if (selectedNodes[0].length === 1) {
      var data = selectedNodes.datum();
      updateUserInfoPanel(data);
    } else {
      hideUserInfoPanel();
    }
  };

  var unSelectNodes = function() {
    var selectedNodes = svg.selectAll('.selected');
    selectedNodes.data().forEach(function(d) {
      d.selected = false;
    });
    d3.timer(function() {
      selectedNodes.classed('selected', function(d) { return d.selected; });
      return true;
    });
  };

  var updateUserInfoPanel = function(data) {
    var selectedDataNodes = dataNodes.filter(function(d) {
      return d.selected;
    });
    if (selectedDataNodes.length > 1) {
      return;
    }
    d3.timer(function() {
      if (data.focus < 0) {
        hideUserInfoPanel();
        return;
      }
      var div = d3.select('.userinfo');
      div.style({'display': 'block'});
      debugging && console.log(data);
      div.select('.id_v').text(data.user.id);
      div.select('.name_v').text(data.user.name);
      div.select('.checkin_v').text(formatTime(data.checkInTime));
      div.select('.checkout_v').text(formatTime(data.checkOutTime));
      div.select('.location_v').text(d3demo.layout.locations[data.focus].name);
      return true;
    });
  };

  var hideUserInfoPanel = function() {
    d3.timer(function() {
      var div = d3.select('.userinfo');
      div.style({'display': 'none'});
      return true;
    });
  };

  var checkInElement = (function() {
    var html = '<li class="check-out">'
      + '<span class="log-action"><i class="fa fa-sign-out"></i> Check-out</span>'
      + '<span class="log-time"></span>'
      + '<span class="log-id"></span>'
      + '<span class="log-location"></span>'
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
      + '<span class="log-time"></span>'
      + '<span class="log-id"></span>'
      + '<span class="log-location"></span>'
    + '</li>';
    var documentFragment = document.createDocumentFragment();
    var element = document.createElement('div');
    element.innerHTML = html;
    documentFragment.appendChild(element.childNodes[0]);
    return documentFragment;
  })();

  var createMessageElement = function(scan) {
    var baseNode = scan.type === 'check-in' ? checkInElement : checkOutElement;
    var element = baseNode.cloneNode(true);
    var li = element.childNodes[0];
    li.childNodes[1].textContent = formatTime(scan.timestamp);
    li.childNodes[2].textContent = 'User ' + scan.user.id;
    li.childNodes[3].textContent = scan.location.name;
    return element;
  }

  var logTracker = {
    count: 0,
    scrolling: false,
    spans: [],
    log: document.getElementById('log')
  }
  var logScan = function(scan) {
    d3.timer(function() {
      document.getElementById('interval').textContent = logTracker.count++;
      document.getElementById('nodeCount').textContent = dataNodes.filter(function(d) {
        return d.focus !== -1;
      }).length;
      return true;
    });
    if (logTracker.spans.length < 50) {
      logTracker.spans.push(createMessageElement(scan));
    }
    if (!logTracker.scrolling) {
      logTracker.scrolling = true;
      d3.timer(function() {
        logTracker.spans.forEach(function(addSpan) {
          logTracker.log.insertBefore(addSpan, logTracker.log.firstChild);
          if (logTracker.log.childNodes.length > 50) {
            logTracker.log.removeChild(log.lastChild);
          }
        });
        logTracker.spans = [];
        logTracker.scrolling = false;
        return true;
      }, 100);
    }
  }

  var progress = {
        playback: d3.select('.progress .playback').node()
      , buffer: d3.select('.progress .buffer').node()
  };

  // logging
  var clock = d3demo.playback.clockProgress.tap(function(time) {
    d3.timer(function() {
      document.getElementById('time').textContent = formatTime(time.timestamp);
      progress.playback.style.width = (100 * (time.minutes - d3demo.playback.START_MINUTES )/ (d3demo.playback.END_MINUTES - d3demo.playback.START_MINUTES )) + '%';
      return true;
    });
  });

  var buffer = d3demo.playback.bufferProgress.tap(function(minutes) {
    progress.buffer.style.width = (100 * (minutes - d3demo.playback.START_MINUTES ) / (d3demo.playback.END_MINUTES - d3demo.playback.START_MINUTES)) + '%';
  });

  var scans = d3demo.playback.scans.tap(function(scan) {
    logScan(scan);
    if (scan.type === 'check-in') {
      checkinNode(scan);
    } else {
      if (scan.location.id !== 0) {
        checkoutNode(scan);
      } else {
        removeNode(scan);
      }
    }
    force.start();
  }, errorHandler);

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

  var errorHandler = function (err) {
    console.log(err.stack);
  };

  var init = function() {
    initForce();
  }

  var start = function() {
    force.start();

    scans.subscribeOnError(errorHandler);
    buffer.subscribeOnError(errorHandler);
    clock.subscribeOnError(errorHandler);

    Rx.Observable.timer(1000).subscribe(function() {
      d3demo.playback.resume();
    })
  }

  return {
    init: init
  , start: start
  , unSelectNodes: unSelectNodes
  , selectNodes: selectNodes
  , getNodeById: getNodeById
  , getNodesByName: getNodesByName
  , hideUserInfoPanel: hideUserInfoPanel
  }
})(d3, Rx);
