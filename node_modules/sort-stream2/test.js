var assert = require("assert")
var through = require("through2")
var concat = require("concat-stream")
var sort = require("./")

var rs = through.obj()
var arr = Array
  .apply(null, Array(100))
  .map(function(){ return {n: Math.random()} })

var compare = function (a, b){ return a.n - b.n }
var before = arr.slice(0).sort(compare)

arr.forEach(rs.write, rs)

rs
  .pipe(sort(compare))
  .pipe(concat(onSorted))

rs.end()

function onSorted(after) {
  assert.deepEqual(before, after)
}
