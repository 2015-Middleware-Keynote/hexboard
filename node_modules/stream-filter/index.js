/* jshint node:true */
"use strict";

var through = require("through");

// # Filter
// Create a through stream that only passes data that passes the given test
// function
module.exports = function(test) {
	return through(function(data) {
		if (test(data)) {
			this.emit("data", data);
		}
	});
};

// # Async Filter
// Create a through stream that only passes data that passes the given async
// test function
module.exports.async = function(test) {
	return through(function(data) {
		var emit = this.emit.bind(this);
		test(data, function(err, passed) {
			if (err) return emit("error", err);
			if (passed) return emit("data", data);
		});
	});
};
