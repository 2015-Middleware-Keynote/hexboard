'use strict';

var Rx = require('rx')
  , locations = require('./api/location/location_controllers').locations
  , userController = require('./api/user/user.js').getUsers
  ;

var GENERAL_SESSIONS_ID = 1
  , ENTRANCE_ID = 0
  , LUNCH1_ID = 2
  , LUNCH2_ID = 3

var KEYNOTE_1_START_MINUTES = 10*60
  , KEYNOTE_2_START_MINUTES = 14*60
  , LUNCH_TIME = 12*60
  , START_MINUTES = 7*60 + 50
  , END_MINUTES = 18*60;

var EVENT_DATE = new Date();
// EVENT_DATE.setDate(EVENT_DATE.getDate() - 1); // yesterday
EVENT_DATE.setHours(0,0,0,0); // start of the day
EVENT_DATE = EVENT_DATE.getTime();

// Returns a random integer between min included) and max (excluded)
var getRandom = function (min, max) {
  return Math.random() * (max - min) + min;
};

var getRandomInt = function (min, max) {
  return Math.floor(getRandom(min,max));
};

var locationWeights = [4, 0, 0, 0, 30, 80, 30, 20, 50, 50, 35, 35];
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

var previousScans = {};

var createRandomScan = function (user, minutes) {
  var lastScan = previousScans[user.id];
  var userLeft = lastScan && lastScan.location.id === ENTRANCE_ID && lastScan.type === 'check-out';
  var present = lastScan && !userLeft
  var checkedIn = present && lastScan.type === 'check-in';
  var atEntrance = present && lastScan.location.id === ENTRANCE_ID;

  var scan;
  if (checkedIn && ! atEntrance) {
    scan = {
      user: user
    , location: lastScan.location
    , type: 'check-out'
    }
  } else {
    var location = getRandomLocation(minutes);
    var type = (location.id == ENTRANCE_ID && (present || minutes > END_MINUTES - 60))
      ? 'check-out'
      : 'check-in';
    scan = {
      user: user
    , location: location
    , type: type
    }
  }
  previousScans[user.id] = scan;
  return scan;
}

var counter = Rx.Observable.interval(25)
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
  });

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
  var users = getUsers();
  var scans = [];
  var rush = (tick.minutes + 5) % 60;
  if (rush > 30) { rush = 60 - rush};
  var numEvents = rush < 10 ? 100 - rush : getRandomInt(0,3); // simulate a rush
  for (var n = 0; n < numEvents; n++) {
    var user = users[getRandomInt(0, users.length)];
    var scan = createRandomScan(user, tick.minutes);
    var eventTimeOffest = getRandomInt(0, 60).toFixed(4);
    scan.timestamp = tick.timestamp + eventTimeOffest * 1000
    scans.push(scan);
  };
  if (scans.length) {
    var binTime = tick.timestamp;
    eventLog[binTime] = scans;
  }
  return intervalFromEvents(scans);
});

var reset = function() {
  previousScans = {};
};

module.exports = {
    startTimestamp: EVENT_DATE + START_MINUTES * 60 * 1000
  , endTimestamp: EVENT_DATE + END_MINUTES * 60 * 1000
  , reset: reset
  , scans: randomScans
}
