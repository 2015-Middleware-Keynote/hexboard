var filter = require("./"),
	test = require("tape");

test("filter", function(t) {
	var stream = filter(function(data) {
		return data.length > 1;
	});
	t.plan(2);
	stream.on("data", t.ok.bind(t));
	stream.on("error", t.ifError.bind(t));
	stream.write("test");
	stream.write("t");
	stream.write("hello");
	stream.write("a");
	t.end();
});

test("filter async", function(t) {
	var stream = filter.async(function(data, callback) {
		process.nextTick(function() {
			callback(null, data.length > 1);
		});
	});
	t.plan(2);
	stream.on("data", t.ok.bind(t));
	stream.on("error", t.ifError.bind(t));
	stream.write("test");
	stream.write("t");
	stream.write("hello");
	stream.write("a");
});
