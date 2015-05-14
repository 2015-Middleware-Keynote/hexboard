'use strict';

var app   = require('./main/app.js')
  , http = require('http')
  , port  = app.get('port')
  , ip = app.get('base url')
  , log   = 'Listening on ' + ip + ':' + port
  ;

var tag = 'SERVER';

var server = http.createServer(app);
server.listen(port, ip);
console.log(tag, log);

require('./ws/beacon-live')(server);
require('./ws/beacon-playback')(server);
require('./ws/beacon-random')(server);
require('./ws/thousand')(server);
require('./ws/broker')(server);
require('./ws/winner')(server);
