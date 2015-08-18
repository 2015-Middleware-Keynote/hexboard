var through = require("through2")

module.exports = function(fn) {
  var arr = []

  return through.obj(transform, flush)

  function transform(data, enc, cb) {
    arr.push(data)
    cb()
  }

  function flush(cb) {
    arr.sort(fn).forEach(this.push, this)
    cb()
  }
}
