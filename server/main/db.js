var mongoose   = require('mongoose');

var dbUrl  = process.env.DB_URL || 'mongodb://localhost/beaconlocation'

module.exports = exports = function (app) {
  mongoose.connection.on("connected", function(ref) {
    console.log("Connected to " + dbUrl + " DB!");
  });

  // If the connection throws an error
  mongoose.connection.on("error", function(err) {
    console.error('Failed to connect to DB ' + dbUrl + ' on startup ', err);
  });

  // When the connection is disconnected
  mongoose.connection.on('disconnected', function () {
    console.log('Mongoose default connection to DB :' + dbUrl + ' disconnected');
  });

  var gracefulExit = function() {
    mongoose.connection.close(function () {
      console.log('Mongoose default connection with DB :' + dbUrl + ' is disconnected through app termination');
      process.exit(0);
    });
  }

  // If the Node process ends, close the Mongoose connection
  process.on('SIGINT', gracefulExit).on('SIGTERM', gracefulExit);

  try {
    console.log("Trying to connect to DB " + dbUrl);
    mongoose.connect(dbUrl);
  } catch (err) {
    console.log("Sever initialization failed " , err.message);
  }
};
