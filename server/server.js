'use strict';

var Rx = require('rx')
  , app   = require('./main/app.js')
  , http = require('http')
  , port  = app.get('port')
  , ip = app.get('base url')
  ;

var tag = 'SERVER';

var server = http.createServer(app);
server.listen(port, ip);
console.log(tag, 'Listening on ' + ip + ':' + port);

require('./hexboard/ws/thousand')(server);
require('./hexboard/ws/winner')(server);
