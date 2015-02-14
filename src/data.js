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
    if (location.id === GENERAL_SESSIONS_ID && count > 20 && count % 60 <= 15) {
      return 3000;
    };
    if (location.id === LUNCH1_ID && count > 20 && count % 80 <= 15) {
      return 3000;
    };
    if (location.id === LUNCH2_ID && count > 20 && count % 80 <= 15) {
      return 3000;
    };
    if (count < 20 && location.id !== GENERAL_SESSIONS_ID) {
      return locationWeights[location.id] === 0 ? 0 : 1;
    }
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
      if (location.id == ENTRANCE_ID && arrived) {
        user.scanner = location.scanners['check-out'];
      } else {
        user.scanner = location.scanners['check-in'];
      }
    }
  }

  var interval = Rx.Observable
    .interval(500);

  var count = 0;
  var interval2 = interval.flatMap(function() {
    var dur = count % 20 <= 1 ? 15 : 50;
    var num = count % 20 <= 1 ? 30 : getRandomInt(3,10);
    count++;
    return Rx.Observable.interval(dur).take(num)
  });

  var source = interval2.map(function() {
    var user = users[getRandomInt(0, users.length)];
    pickRandomScanner(user);
    return {
      user: user
    , scanner: user.scanner
    }
  });

  var resetUsers = function() {
    users.forEach(function(user) {
      user.lastScanner = user.scanner = null;
    })
    count = 0;
  };

  return {
    width: width
  , height: height
  , locations: locations
  , source: source
  , resetUsers: resetUsers
  }
})(d3, Rx);
