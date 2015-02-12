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
  ];

  var users = [];

  for (var i = 0; i < 200; i++) {
    users.push({
      id: i
    , name: 'Firstname' + i + ' Lastname' + i
    });
  };

  // Returns a random integer between min included) and max (excluded)
  var getRandomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  var checkInScanners = scanners.filter(function(scanner) {
    return scanner.type === 'check-in';
  });

  var availableScanners = [scanners[1]].concat(checkInScanners).filter(function(scanner) {
    return !(scanner.type === 'check-in' && scanner.location.id === 0);
  });

  var pickRandomScanner = function (user) {
    var userLeft = (user.scanner && user.scanner.type === 'check-out' && user.scanner.location.id === 0);
    user.lastScanner = userLeft ? null : user.scanner;
    var arrived = !! user.lastScanner
    var checkedIn = arrived && user.lastScanner.type === 'check-in';
    var atEntrance = arrived && user.lastScanner.location.id === 0;
    if (checkedIn && ! atEntrance) {
      user.scanner = scanners[user.lastScanner.id + 1];
    } else {
      if (arrived) {
        // can't check-in to Entrance
        user.scanner = availableScanners[getRandomInt(0, availableScanners.length)];
      } else {
        user.scanner = checkInScanners[getRandomInt(0, checkInScanners.length)];
      }
    }
  }

  var interval = Rx.Observable
    .interval(500);

  var interval2 = Rx.Observable.merge(
    interval.take(2).flatMap(function() {
      return Rx.Observable.interval(20).take(25)
    })
  , interval.skip(2).flatMap(function() {
      return Rx.Observable.interval(50).take(getRandomInt(2,10))
    })
  );

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
