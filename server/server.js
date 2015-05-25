'use strict';

var Rx = require('rx')
  , app   = require('./main/app.js')
  , http = require('http')
  , port  = app.get('port')
  , ip = app.get('base url')
  , log   = 'Listening on ' + ip + ':' + port
  , user = require('./api/user/user.js')
  ;

var tag = 'SERVER';

var server = http.createServer(app);
server.listen(port, ip);
console.log(tag, log);

var dataInit = Rx.Observable.forkJoin(
  user.userInit
).tapOnCompleted(function() {
  require('./ws/beacon-live')(server);
  require('./ws/beacon-playback')(server);
  require('./ws/beacon-random')(server);
  require('./ws/broker')(server);
  require('./thousand/ws/thousand')(server);
  require('./thousand/ws/winner')(server);
})
.subscribeOnError(function(err) {
  console.log(err.stack || err);
});
