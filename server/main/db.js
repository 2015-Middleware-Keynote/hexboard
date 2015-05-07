var mongoose   = require('mongoose');

var dbUrl  = process.env.DB_URL || 'mongodb://localhost/beaconlocation'

var tag = 'DB';

module.exports = exports = function (app) {
  mongoose.connection.on('connected', function(ref) {
    console.log(tag, 'Connected to ' + dbUrl + ' DB!');
  });

  // If the connection throws an error
  mongoose.connection.on('error', function(err) {
    console.error('Failed to connect to DB ' + dbUrl + ' on startup ', err);
  });

  // When the connection is disconnected
  mongoose.connection.on('disconnected', function () {
    console.log(tag, 'Mongoose default connection to DB :' + dbUrl + ' disconnected');
  });

  var gracefulExit = function() {
    mongoose.connection.close(function () {
      console.log(tag, 'Mongoose default connection with DB :' + dbUrl + ' is disconnected through app termination');
      process.exit(0);
    });
  }

  // If the Node process ends, close the Mongoose connection
  process.on('SIGINT', gracefulExit).on('SIGTERM', gracefulExit);

  try {
    console.log(tag, 'Trying to connect to DB ' + dbUrl);
    mongoose.connect(dbUrl);
  } catch (err) {
    console.log(tag, 'Sever initialization failed ' , err.message);
  }
};
