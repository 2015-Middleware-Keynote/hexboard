'use strict';

var mongoose = require('mongoose');

var ObjectId = mongoose.Schema.Types.ObjectId;

 var UserSchema = new mongoose.Schema({
  firstName: {type: String, required: true},
  lastName: {type: String, required: true},
  beaconId: {type: String, required: true, unique: true},
  created: { type: Date, default: Date.now }
});

module.exports = exports = mongoose.model('User', UserSchema);
