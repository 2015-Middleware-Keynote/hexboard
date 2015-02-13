'use strict';

var d3demo = d3demo || {};

d3demo = (function dataSimulator(d3, Rx) {
  var width = 960;
  var height = 570;

  var locations = [
    { id: 0, x: 165, y: height - 50, name: 'Entrance'}
  , { id: 1, x: 360, y: 245, name: 'Red Hat Booth 1'}
  , { id: 2, x: 635, y: 245, name: 'Red Hat Booth 2'}
  , { id: 3, x: 100, y: 350, name: 'The Cube'}
  , { id: 4, x: 340, y: 400, name: 'Room 207 SUMMIT Track'}
  , { id: 5, x: 455, y: 400, name: 'Room 208 SUMMIT Track'}
  , { id: 6, x: 550, y: 400, name: 'Room 209 SUMMIT Track'}
  , { id: 7, x: 140, y: 220, name: 'General Sessions'}
  ];

  var scanners = [
    { id: 0, type: 'check-in', location: locations[0]}
  , { id: 1, type: 'check-out', location: locations[0]}
  , { id: 2, type: 'check-in', location: locations[1]}
  , { id: 3, type: 'check-out', location: locations[1]}
  , { id: 4, type: 'check-in', location: locations[2]}
  , { id: 5, type: 'check-out', location: locations[2]}
  , { id: 6, type: 'check-in', location: locations[3]}
  , { id: 7, type: 'check-out', location: locations[3]}
  , { id: 8, type: 'check-in', location: locations[4]}
  , { id: 9, type: 'check-out', location: locations[4]}
  , { id: 10, type: 'check-in', location: locations[5]}
  , { id: 11, type: 'check-out', location: locations[5]}
  , { id: 12, type: 'check-in', location: locations[6]}
  , { id: 13, type: 'check-out', location: locations[6]}
  , { id: 14, type: 'check-in', location: locations[7]}
  , { id: 15, type: 'check-out', location: locations[7]}
  ];

  var users = [];

  for (var i = 0; i < 200; i++) {
    users.push({
      id: i
    , name: 'Firstname' + i + ' Lastname' + i
    });
  };

  scanners.forEach(function(scanner) {
    scanner.location['scanners'] = scanner.location['scanners'] || {};
    scanner.location['scanners'][scanner.type] = scanner;
  });

  // Returns a random integer between min included) and max (excluded)
  var getRandom = function (min, max) {
    return Math.random() * (max - min) + min;
  };

  var getRandomInt = function (min, max) {
    return Math.floor(getRandom(min,max));
  };

  var locationWeights = [4, 30, 80, 30, 50, 20, 50, 0];
  var getLocationWeight = function(location) {
    if (location.id === 7 && count > 20 && count % 60 <= 15) {
      return 3000;
    };
    if (count < 20 && location.id !== 7) {
      return 4;
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
    var userLeft = (user.scanner && user.scanner.type === 'check-out' && user.scanner.location.id === 0);
    user.lastScanner = userLeft ? null : user.scanner;
    var arrived = !! user.lastScanner
    var checkedIn = arrived && user.lastScanner.type === 'check-in';
    var atEntrance = arrived && user.lastScanner.location.id === 0;
    if (checkedIn && ! atEntrance) {
      user.scanner = scanners[user.lastScanner.id + 1];
    } else {
      var location = getRandomLocation();
      user.scanner = user.scanner = location.scanners['check-in'];
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
  };

  return {
    width: width
  , height: height
  , locations: locations
  , source: source
  , resetUsers: resetUsers
  }
})(d3, Rx);
