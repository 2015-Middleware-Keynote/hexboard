'use strict';

var d3demo = d3demo || {};

d3demo = (function dataSimulator(d3, Rx) {
  var scale = 1.4;
  var mapContainer = document.querySelector('.map');
  scale = mapContainer.offsetWidth / 1949;
  var width = 1949*scale
    , height = 1389*scale;

  var GENERAL_SESSIONS_ID = 1
    , ENTRANCE_ID = 0
    , LUNCH1_ID = 2
    , LUNCH2_ID = 3

  var KEYNOTE_1_START_MINUTES = 10*60
    , KEYNOTE_2_START_MINUTES = 14*60
    , LUNCH_TIME = 12*60
    , START_MINUTES = 7*60 + 50
    , END_MINUTES = 18*60;

  var EVENT_DATE = new Date('2015-06-23').getTime() + 7 * 60 * 60 * 1000;

  var locations = [
    { id: 0, x: 370, y: 1270, name: 'Entrance'}
  , { id: 1, x: 310, y: 510, name: 'General Sessions'}
  , { id: 2, x: 860, y: 240, name: 'Lunch 1'}
  , { id: 3, x: 1590, y: 210, name: 'Lunch 2'}
  , { id: 4, x: 860, y: 600, name: 'Red Hat Booth 1'}
  , { id: 5, x: 1570, y: 600, name: 'Red Hat Booth 2'}
  , { id: 6, x: 90,  y: 1110, name: 'Room 200 DV Lounge and Hackathons'}
  , { id: 7, x: 680, y: 1170, name: 'Room 201 DEVNATION Track'}
  , { id: 8, x: 870, y: 1170, name: 'Room 202 DEVNATION Track'}
  , { id: 9, x: 1070, y: 1170, name: 'Room 203 DEVNATION Track'}
  , { id: 10, x: 1250, y: 1170, name: 'Room 204 DEVNATION Track'}
  ];

  var users = [];

  for (var i = 0; i < 200; i++) {
    users.push({
      id: i
    , name: 'Firstname' + i + ' Lastname' + i
    });
  };

  locations.forEach(function(location, index) {
    location.x = location.x * scale;
    location.y = location.y * scale;
    var checkin = {
      id: 2*index
    , type: 'check-in'
    , location: location
    };
    var checkout = {
      id: 2*index +1
    , type: 'check-out'
    , location: location
    };
    location['scanners'] = {
      'check-in': checkin
    , 'check-out': checkout
    };
  });

  // Returns a random integer between min included) and max (excluded)
  var getRandom = function (min, max) {
    return Math.random() * (max - min) + min;
  };

  var getRandomInt = function (min, max) {
    return Math.floor(getRandom(min,max));
  };

  var locationWeights = [4, 0, 0, 0, 30, 80, 30, 20, 50, 50, 35];
  var getLocationWeight = function(location, minutes) {
    if (location.id === GENERAL_SESSIONS_ID && KEYNOTE_1_START_MINUTES - 10 <= minutes && minutes <= KEYNOTE_1_START_MINUTES + 10) {
      return 6000;
    };
    if (location.id === GENERAL_SESSIONS_ID && KEYNOTE_2_START_MINUTES - 10 <= minutes && minutes <= KEYNOTE_2_START_MINUTES + 10) {
      return 3000;
    };
    if ((location.id === LUNCH1_ID || location.id === LUNCH2_ID) && LUNCH_TIME - 5 <= minutes && minutes <= LUNCH_TIME + 25) {
      return 3000;
    };
    if (location.id === ENTRANCE_ID && minutes > END_MINUTES - 60) {
      return 6000;
    };
    return locationWeights[location.id];
  }

  var getRandomLocation = function(minutes) {
    var totalWeight = locations.reduce(function (sumSoFar, location, index, array) {
      return sumSoFar + getLocationWeight(location, minutes);
    }, 0);
    var random = getRandom(0, totalWeight)
      , sum = 0
      , randomLocation;
    for (var i = 0; i < locations.length; i++) {
      var location = locations[i];
      sum += getLocationWeight(location, minutes);
      if (random < sum) {
        randomLocation = locations[i];
        break;
      }
    }
    return randomLocation;
  };

  var pickRandomScanner = function (user, minutes) {
    var userLeft = (user._scanner && user._scanner.type === 'check-out' && user._scanner.location.id === ENTRANCE_ID);
    user._lastScanner = userLeft ? null : user._scanner;
    var arrived = !! user._lastScanner
    var checkedIn = arrived && user._lastScanner.type === 'check-in';
    var atEntrance = arrived && user._lastScanner.location.id === ENTRANCE_ID;
    if (checkedIn && ! atEntrance) {
      user._scanner = user._scanner.location.scanners['check-out'];
    } else {
      var location = getRandomLocation(minutes);
      if (location.id == ENTRANCE_ID && (arrived || minutes > END_MINUTES - 60)) {
        user._scanner = location.scanners['check-out'];
      } else {
        user._scanner = location.scanners['check-in'];
      }
    }
  }

  var resetUsers = function() {
    users.forEach(function(user) {
      user._lastScanner = user._scanner = null;
    })
  };

  var pauser = new Rx.Subject();

  var counter = Rx.Observable.interval(50)
    .map(function(n) {
      var minutes = START_MINUTES + n; // increment in 1 minute increments
      return {
        n: n
      , minutes: minutes
      , timestamp: EVENT_DATE + minutes * 60 * 1000 // timestamp in ms
      }
    })
    .takeWhile(function(tick) {
      return tick.minutes <= END_MINUTES;
      // return tick.minutes <= START_MINUTES + 20;
    })
    .pausable(pauser).publish();

  var playbackClock = counter.filter(function(tick) {
      return tick.timestamp % 300000 === 0;
    }).pausable(pauser).publish();

  var eventLog = {};

  var intervalFromEvents = function(events) {
    var stream;
    if (!events || !events.length) {
       stream = Rx.Observable.empty();
    } else {
      stream = Rx.Observable.range(0, events.length).map(function(n) {
        return events[n];
      }).take(events.length);
    }
    return stream;
  };

  var randomScans = counter.flatMap(function(tick) {
    var events = [];
    var rush = (tick.minutes + 5) % 60;
    if (rush > 30) { rush = 60 - rush};
    var numEvents = rush < 10 ? 100 - rush : getRandomInt(0,3); // simulate a rush
    for (var n = 0; n < numEvents; n++) {
      var user = users[getRandomInt(0, users.length)];
      pickRandomScanner(user, tick.minutes);
      var eventTimeOffest = getRandomInt(0, 60).toFixed(4);
      var event = {
        user: user
      , _minutes: tick.minutes
      , timestamp: tick.timestamp + eventTimeOffest * 1000
      , scanner: user._scanner
      }
      events.push(event);
    };
    if (events.length) {
      var binTime = tick.timestamp;
      eventLog[binTime] = events;
    }
    return intervalFromEvents(events);
  }).pausable(pauser).publish();

  randomScans.subscribe(function() {}, function(error) {console.log(error)}, function() {
      eventLog.startTimestamp = EVENT_DATE;
      console.log(JSON.stringify(eventLog, function(key, value) {
        if (key === 'location') {
          return value.id;
        } else if (key[0] == '_') {
          return undefined;
        }
        return value;
      }, 2));
      analyzePlaybackData(eventLog);
    }
  );

  var playbackRandom = function(cb) {
    cb(playbackClock, randomScans);
    pauser.onNext(false);
    counter.connect();
    playbackClock.connect();
    randomScans.connect();
    pauser.onNext(true);
  };

  var playbackScans = function(cb) {
    d3.json('/event_log.json', function(error, json) {
      if (error) {
        console.log(error)
      }
      analyzePlaybackData(json)
      var playBackSource = counter.filter(function(tick) {
        return tick.timestamp % 3000 === 0;
      })
      .flatMap(function(tick) {

        var events = json[tick.timestamp];
        if (events) {
          events.forEach(function(event) {
            event.scanner.location = locations[event.scanner.location];
          })
        }
        return intervalFromEvents(events);
      })
      .pausable(pauser).publish();

      cb(playbackClock, playBackSource);
      pauser.onNext(false);
      counter.connect();
      playbackClock.connect();
      playBackSource.connect();
      pauser.onNext(true);
    });
  }

  var analyzePlaybackData = function(json) {
    function compareNumbers(a, b) {
      return a - b;
    }

    var eventTimes = Object.keys(json).map(function(time) {
      return parseInt(time);
    }).filter(function(time) {
      return !isNaN(time);
    }).sort(compareNumbers);

    var deltaMap = {}
      , previousTime = 0
      , sum = 0
      , numEventsPerInterval = [];
    eventTimes.forEach(function(binTime) {
      var numEvents = json[binTime].length;
      numEventsPerInterval[numEvents] = numEventsPerInterval[numEvents] || 0;
      numEventsPerInterval[numEvents]++;
      sum += json[binTime].length;
      if (previousTime) {
        deltaMap[binTime - previousTime] = true;
      }
      previousTime = binTime;
    });
    var deltas = Object.keys(deltaMap).map(function(time) {
      return parseInt(time);
    }).sort(compareNumbers);
    console.log('No. events:', sum); // 4506
    console.log('Deltas dividends:', deltas.map(function(time) {
      return time / deltas[0];
    }));
    console.log('Smallest Delta:', deltas[0], 'ms / ', deltas[0] / 1000 , 's');
    console.log('Number of intervals with "n" events:', numEventsPerInterval)
  }

  return {
    width: width
  , height: height
  , locations: locations
  , eventTimeStamp: EVENT_DATE + START_MINUTES * 60 * 1000
  , pauser: pauser
  , resetUsers: resetUsers
  , getRandomInt: getRandomInt
  , playback: playbackRandom
  // , playback: playbackScans
  }
})(d3, Rx);
