'use strict';

var mongoose = require('mongoose');

var ObjectId = mongoose.Schema.Types.ObjectId;

 var ScanSchema = new mongoose.Schema({
  beaconId: {type: String, required: true},
  location: {type: String, required: true},
  type: {type: String, required: true}, // check-in / check-out
  timestamp: {type: Date, required: true},
  created: { type: Date, default: Date.now }
});

module.exports = exports = mongoose.model('Scan', ScanSchema);
