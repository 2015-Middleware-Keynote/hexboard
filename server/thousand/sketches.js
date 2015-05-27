var random = require('./random')
 , thousandEmitter = require('./thousandEmitter')
 ;

var randomDoodles = function(req, res, next) {
  var numDoodles = req.params.numDoodles;
  random.randomDoodles(numDoodles)
    .subscribe(function(sketch) {
      thousandEmitter.emit('new-sketch', sketch);
    }, function(error) {
      next(error)
    }, function() {
      console.log(numDoodles + ' sketches pushed');
      res.json({msg: numDoodles + ' sketches pushed'});
    });
}

var receiveImage = function(req, res, next) {
  var containerId = parseInt(req.params.containerId);
  var data;
  if (containerId < 0 || containerId >= 1060) {
    console.log("invalid container id");
    next('Invalid containerId');
    return;
  };
  var data = new Buffer('');
  req.on('data', function(chunk) {
    data = Buffer.concat([data, chunk]);
  });
  req.on('error', function(err) {
    next(err);
  });
  req.on('end', function() {
    var filename = 'sketch.png';
    fs.open('./static/img/' + filename, 'w', function(err, fd) {
      if (err) {
        next(err);
      };
      fs.write(fd, data, 0, data.length, 0, function(err, written, buffer) {
        if (err) {
          next(err);
        };
        var sketch = {
          url: 'http://localhost'+'/img/sketch.png'
        , username: req.query.username
        , cuid: req.query.cuid
        , containerId: req.query.cuid
        , submissionId: req.query.submission_id
        }
        console.log(sketch);
        thousandEmitter.emit('new-sketch', sketch)
        return res.json(sketch)
      });
    })
  });
}

module.exports = {
  receive: receiveImage
, randomDoodles: randomDoodles
};
