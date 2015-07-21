'use strict';

var request = require('request')
  , fs = require('fs')
  , Rx = require('rx')
  , http = require('http')
  ;

var numberOfPeople = 1026;
var duration = 60; // seconds

// Returns a random integer between min included) and max (excluded)
var getRandomInt = function (min, max) {
  return Math.floor(Math.random() * (max - min) + min);
};

// var pool = new http.Agent();
// pool.maxSockets = Infinity;
// var baseRequest = request.defaults({
//   pool: {maxSockets: Infinity}
// })
http.globalAgent.maxSockets = Infinity;
console.log(http.globalAgent);

var postImage = function(submission) {
  var user = submission.person;
  var id = getRandomInt(0,1060);
  var url = 'http://localhost:9000/api/sketch/0?name='+user.name+'&cuid='+user.cuid+'&submission_id='+user.submissionId;
  // var url = 'http://1k.jbosskeynote.com/api/sketch/0?name='+user.name+'&cuid='+user.cuid+'&submission_id='+user.submissionId;
  // var url = 'http://ec2-52-7-153-116.compute-1.amazonaws.com:80/api/sketch/0?name='+user.name+'&cuid='+user.cuid+'&submission_id='+user.submissionId;
  var options = {
    url: url,
    body: submission.buffer
  };
  // console.log(options);
  var req = request.post(options, function (err, res, body) {
    if (err) {
      console.log('*** Error ***:',err);
      console.log('*** Body *** :',body);
      return;
    }
    console.log('res', res.body);
  });
}

var bufferList = Rx.Observable.fromNodeCallback(fs.readdir)('static/thousand/sketches/')
  .flatMap(function(filenames) {
    return filenames;
  })
  .flatMap(function(filename) {
    return Rx.Observable.fromNodeCallback(fs.readFile)('static/thousand/sketches/' + filename);
  })
  .toArray();

var randomEvents = bufferList.flatMap(function(buffers) {
  return Rx.Observable.range(0, buffers.length)
}).map(function(index) {
    return {
      id: index,
      name: 'Firstname' + index + ' Lastname' + index,
      cuid: index,
      submissionId: index + '_' + index
    }
  })
  .flatMap(function(person) {
    var delay = getRandomInt(0, duration * 1000);
    return Rx.Observable.return(person).delay(delay);
  });

bufferList.flatMap(function(buffers) {
  return randomEvents.map(function(person) {
    // var index = getRandomInt(0, buffers.length);
    var submission = {
      person: person,
      buffer: buffers[person.id]
    };
    return submission;
  })
})
.tap(function(submission) {
  console.log(new Date(), 'Post');
  postImage(submission);
})
.subscribeOnError(function(err) {
  console.log(err.stack || err);
})
