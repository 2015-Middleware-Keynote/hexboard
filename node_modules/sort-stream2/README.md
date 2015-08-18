sort-stream2
============

Array.prototype.sort for streams, a refresh of [@domenictarr](/dominictarr)'s [sort-stream](/dominictarr/sort-stream).

Example
-------

```javascript
var sort = require("sort-stream2")
var through = require("through2")

var objs = through.obj()
objs.write({id: 3})
objs.write({id: 2})
objs.write({id: 1})
objs.end()

objs
  .pipe(sort(function(a, b){ return a.id - b.id }))
  .on("data", console.log)

// {id: 1}
// {id: 2}
// {id: 3}
```
