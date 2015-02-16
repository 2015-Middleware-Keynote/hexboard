'use strict';

var d3demo = d3demo || {};

d3demo = (function dataSimulator(d3, Rx) {
  var scale = 1.4;
  var width = 960*scale
    , height = 570*scale;

  var GENERAL_SESSIONS_ID = 1
    , ENTRANCE_ID = 0
    , LUNCH1_ID = 2
    , LUNCH2_ID = 3

  var KEYNOTE_1_START_TIME = 10*60
    , KEYNOTE_2_START_TIME = 14*60
    , LUNCH_TIME = 12*60
    , START_TIME = 7*60 + 50
    , END_TIME = 18*60;

  var EVENT_DATE = new Date('2015-06-23').getTime() + 7 * 60 * 60 * 1000;

  var locations = [
    { id: 0, x: 165, y: 520, name: 'Entrance'}
  , { id: 1, x: 140, y: 220, name: 'General Sessions'}
  , { id: 2, x: 350, y: 100, name: 'Lunch 1'}
  , { id: 3, x: 640, y: 100, name: 'Lunch 2'}
  , { id: 4, x: 350, y: 250, name: 'Red Hat Booth 1'}
  , { id: 5, x: 635, y: 245, name: 'Red Hat Booth 2'}
  , { id: 6, x: 60,  y: 450, name: 'Room 200 DV Lounge and Hackathons'}
  , { id: 7, x: 285, y: 465, name: 'Room 201 DEVNATION Track'}
  , { id: 8, x: 355, y: 465, name: 'Room 202 DEVNATION Track'}
  , { id: 9, x: 430, y: 465, name: 'Room 203 DEVNATION Track'}
  , { id: 10, x: 500, y: 465, name: 'Room 204 DEVNATION Track'}
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
  var getLocationWeight = function(location) {
    if (location.id === GENERAL_SESSIONS_ID && KEYNOTE_1_START_TIME - 10 <= time && time <= KEYNOTE_1_START_TIME + 10) {
      return 6000;
    };
    if (location.id === GENERAL_SESSIONS_ID && KEYNOTE_2_START_TIME - 10 <= time && time <= KEYNOTE_2_START_TIME + 10) {
      return 3000;
    };
    if ((location.id === LUNCH1_ID || location.id === LUNCH2_ID) && LUNCH_TIME - 5 <= time && time <= LUNCH_TIME + 25) {
      return 3000;
    };
    if (location.id === ENTRANCE_ID && time > END_TIME - 60) {
      return 6000;
    };
    return locationWeights[location.id];
  }

  var getRandomLocation = function() {
    var totalWeight = locations.reduce(function (sumSoFar, location, index, array) {
      return sumSoFar + getLocationWeight(location);
    }, 0);
    var random = getRandom(0, totalWeight)
      , sum = 0
      , randomLocation;
    for (var i = 0; i < locations.length; i++) {
      var location = locations[i];
      sum += getLocationWeight(location);
      if (random < sum) {
        randomLocation = locations[i];
        break;
      }
    }
    return randomLocation;
  };

  var pickRandomScanner = function (user) {
    var userLeft = (user.scanner && user.scanner.type === 'check-out' && user.scanner.location.id === ENTRANCE_ID);
    user.lastScanner = userLeft ? null : user.scanner;
    var arrived = !! user.lastScanner
    var checkedIn = arrived && user.lastScanner.type === 'check-in';
    var atEntrance = arrived && user.lastScanner.location.id === ENTRANCE_ID;
    if (checkedIn && ! atEntrance) {
      user.scanner = user.scanner.location.scanners['check-out'];
    } else {
      var location = getRandomLocation();
      if (location.id == ENTRANCE_ID && (arrived || time > END_TIME - 60)) {
        user.scanner = location.scanners['check-out'];
      } else {
        user.scanner = location.scanners['check-in'];
      }
    }
  }

  var pauser = new Rx.Subject();

  var time = START_TIME;
  var clock = Rx.Observable
    .interval(600).map(function() {
      time = time + 5;
      var hour = Math.floor(time / 60) % 24
        , min = String('0' + time % 60).slice(-2);
      return {
        time: EVENT_DATE + time * 60 * 1000
      }
    })
    .takeWhile(function() {
      return time <= END_TIME
    })
    .pausable(pauser).publish()
    ;

  var events = clock.flatMap(function() {
    var rush = (time + 5) % 60 < 10;
    var dur = rush ? 5 : 50;
    var num = rush ? 200 : getRandomInt(3,10);
    return Rx.Observable.interval(dur).map(function(eventCount) {
      return {
        eventCount: eventCount
      , dur: dur
      , num: num
      }
    }).take(num)
  });


  var scans = events.map(function(event) {
    var eventTime = time + (event.eventCount * event.dur) * 5 / 600;
    var user = users[getRandomInt(0, users.length)];
    pickRandomScanner(user);
    return {
      user: user
    , time: EVENT_DATE + eventTime * 60 * 1000
    , scanner: user.scanner
    }
  })
  .takeWhile(function() {
    return time <= END_TIME
  })
  .pausable(pauser).publish();

  var resetUsers = function() {
    users.forEach(function(user) {
      user.lastScanner = user.scanner = null;
    })
    time = START_TIME;
  };

  return {
    width: width
  , height: height
  , locations: locations
  , eventTimeStamp: EVENT_DATE + START_TIME * 60 * 1000
  , pauser: pauser
  , clock: clock
  , scans: scans
  , resetUsers: resetUsers
  }
})(d3, Rx);
