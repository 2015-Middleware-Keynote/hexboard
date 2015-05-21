'use strict';

var locations = [
  { id: 0, x_i: 370, y_i: 1270, name: 'Entrance', code: 'Entrance'}
, { id: 1, x_i: 310, y_i: 510, name: 'General Sessions', code: 'General'}
, { id: 2, x_i: 860, y_i: 240, name: 'Lunch 1', code: 'Lunch1'}
, { id: 3, x_i: 1590, y_i: 210, name: 'Lunch 2', code: 'Lunch2'}
, { id: 4, x_i: 860, y_i: 600, name: 'Red Hat Booth 1', code: 'Booth1'}
, { id: 5, x_i: 1570, y_i: 600, name: 'Red Hat Booth 2', code: 'Booth2'}
, { id: 6, x_i: 90,  y_i: 1110, name: 'Room 200 Community meets Enterprise', code: 'Room200'}
, { id: 7, x_i: 680, y_i: 1170, name: 'Room 201 Devnation Track A', code: 'Room201'}
, { id: 8, x_i: 870, y_i: 1170, name: 'Room 202 Devnation Track B', code: 'Room202'}
, { id: 9, x_i: 1070, y_i: 1170, name: 'Room 203 Devnation Track C', code: 'Room203'}
, { id: 10, x_i: 1250, y_i: 1170, name: 'Room 204 Devnation Track D', code: 'Room204'}
, { id: 11, x_i: 1800, y_i: 1170, name: 'Room 206 Devnation Track E', code: 'Room206'}
, { id: 12, x_i: 150, y_i: 1300, name: 'Devzone', code: 'Devzone'}
, { id: 13, x_i: 1750, y_i: 1300, name: 'Community Lounge', code: 'Lounge'}
, { id: 14, x_i: 1800, y_i: 150, name: 'Ballroom A 3rd floor', code: 'Ballroom'}
];

var tag = 'API/LOCATION';

var locationHashMap = {};
locations.forEach(function(location) {
  locationHashMap[location.code] = location;
});

var convertLocation = function(code) {
  var location = locationHashMap[code];
  if (!location) {
    switch(code) {
      case 'Room205':
        location = locationHashMap['Ballroom'];
        break;
      case 'Room206':
        location = locationHashMap['Room200'];
        break;
      case 'Unknown':
        location = locationHashMap['Entrance'];
        break;
      default:
        if (code.lastIndexOf('x')) {
          console.log(tag, 'Exit event leaked through:', code);
        } else {
          console.log(tag, 'Unmapped location code:', code);
        }
        location = locationHashMap['Entrance'];
    };
  }
  return location;
}

module.exports = exports = {
  getAll: function(req, res, next) {
    res.json(locations);
  }
, getLocation: function(req, res, next) {
    res.json(locations[req.params.id]);
  }
, locations: locations
, convertLocation: convertLocation
};
