'use strict';

var d3demo = d3demo || {};

d3demo.visualisation = (function visualisation(d3, Rx) {
  var checkinNode = function(movement) {
    var dataNode = movement.dataNode;
    dataNode.beaconId = movement.beaconId;
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
    var dataNode = checkout.dataNode;
    dataNode.present = false;
    dataNode.exiting = false;
    dataNode.checkOutTime = checkout.timestamp;
    dataNode.checkOutTimeInternal = new Date().getTime();
    if (dataNode.selected) {
      updateUserInfoPanel(dataNode);
    }
  };

  var removeNode = function(departure) {
    var dataNode = departure.dataNode;
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
    var selectedNodes = d3demo.forcemap.getSelectedNodes();
    selectedNodes.data().forEach(function(d) {
      d.selected = false;
    });
    d3.timer(function() {
      selectedNodes.classed('selected', function(d) { return d.selected; });
      d3demo.forcemap.start();
      return true;
    });
  };

  var updateUserInfoPanel = function(data) {
    if (d3demo.forcemap.getSelectedNodes().length > 1) {
      return;
    }
    d3.timer(function() {
      if (data.focus < 0) {
        hideUserInfoPanel();
        return;
      }
      var div = d3.select('.userinfo');
      div.style({'display': 'block'});
      div.select('.id_v').text(data.user.id);
      div.select('.beacon_v').text(data.beaconId);
      div.select('.name_v').text(data.user.name);
      div.select('.checkin_v').text(formatTime(data.checkInTime));
      div.select('.checkout_v').text(formatTime(data.checkOutTime));
      div.select('.location_v').text(d3demo.layout.getLocations()[data.focus].name);
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

  var checkOutElement = (function() {
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

  var checkInElement = (function() {
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
      document.getElementById('nodeCount').textContent = d3demo.forcemap.getNodeCount();
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

  var timeElement = document.getElementById('time');

  var tap = function(scansStream, clockStream, bufferStream) {
    var clock, buffer, scans;

    if (clockStream) {
      clock = clockStream.tap(function(time) {
        d3.timer(function() {
          timeElement.textContent = formatTime(time.timestamp);
          progress.playback.style.width = time.percent + '%';
          d3demo.forcemap.start();
          return true;
        });
      });
    };

    if (bufferStream) {
      buffer = bufferStream.tap(function(percent) {
        progress.buffer.style.width = percent + '%';
      });
    };

    scans = scansStream.tap(function(scan) {
      scan.dataNode = d3demo.forcemap.getDataNodeById(scan.user.id);
      if (!scan.dataNode.user) {
        scan.dataNode.user = scan.user;
      }
      if (scan.retransmit) {
        if (scan.dataNode.focus === scan.location.id) {
          d3demo.forcemap.particle(scan.dataNode);
          d3demo.forcemap.start();
          return;
        };
      };
      logScan(scan);
      if (scan.type === 'check-in') {
        checkinNode(scan);
      } else if (scan.type === 'check-out') {
        if (scan.location.id !== 0) {
          checkoutNode(scan);
        } else {
          removeNode(scan);
        }
      } else {
        console.log('Ignoring scan of type: ' + scan.type);
      }
      d3demo.forcemap.start();
    });

    return {
      scans: scans
    , clock: clock
    , buffer: buffer
    }
  };

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

  var random = function() {
    d3.select('#cover').style({visibility: 'visible', opacity: '0.6'});
    var playback = d3demo.playback.playback(d3demo.stomp.random);
    var streams = tap(playback.scans, playback.clockProgress, playback.bufferProgress);
    d3demo.forcemap.start();

    streams.scans.subscribeOnError(errorHandler);
    streams.buffer.subscribeOnError(errorHandler);
    streams.clock.subscribeOnError(errorHandler);

    var bufferPartiallyFull = streams.buffer.filter(function (percent) {
        return percent > 25;
      }).map(function() {
        return 'buffer 25% full';
      }).take(1);
    var timeDelay = Rx.Observable.from([0]).delay(5000).map(function() {
      return '5000 ms'
    });

    var ready = Rx.Observable.merge(bufferPartiallyFull, timeDelay).take(1);

    console.log('Buffering...');

    ready.subscribe(function(readySource) {
      d3.select('#cover').style({visibility: 'hidden', opacity: '0'});
      console.log('Starting playback after ' + readySource);
      d3demo.playback.resume();
    });
  };

  var live = function() {
    var streams = tap(d3demo.stomp.live);
    d3demo.forcemap.start();

    streams.scans.subscribeOnError(errorHandler);
  };

  var playback = function() {
    d3.select('#cover').style({visibility: 'visible', opacity: '0.6'});
    var playback = d3demo.playback.playback(d3demo.stomp.playback);
    var streams = tap(playback.scans, playback.clockProgress, playback.bufferProgress);
    d3demo.forcemap.start();

    streams.scans.subscribeOnError(errorHandler);
    streams.buffer.subscribeOnError(errorHandler);
    streams.clock.subscribeOnError(errorHandler);

    var bufferPartiallyFull = streams.buffer.filter(function (percent) {
        return percent > 25;
      }).map(function() {
        return 'buffer 25% full';
      }).take(1);
    var timeDelay = Rx.Observable.from([0]).delay(5000).map(function() {
      return '5000 ms'
    });

    var ready = Rx.Observable.merge(bufferPartiallyFull, timeDelay).take(1);

    console.log('Buffering...');

    ready.subscribe(function(readySource) {
      d3.select('#cover').style({visibility: 'hidden', opacity: '0'});
      console.log('Starting playback after ' + readySource);
      d3demo.playback.resume();
    });
  }

  return {
    live: live
  , playback: playback
  , random: random
  , unSelectNodes: unSelectNodes
  , selectNodes: selectNodes
  , hideUserInfoPanel: hideUserInfoPanel
  }
})(d3, Rx);
