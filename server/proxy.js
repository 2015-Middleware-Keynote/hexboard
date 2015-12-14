var httpProxy = require('http-proxy');
var proxy     = httpProxy.createProxyServer({secure: false});
var url       = require('url')
var config    = require('./config')
var Netmask   = require('netmask').Netmask

proxy.on('close', function (req, socket, head) {
  // Alert when connections are dropped
  console.log('proxy connection dropped');
});
proxy.on('error',  function (error, req, res) {
  console.log('proxy error', error);
  console.log('proxy req', req);
  console.log('proxy res', res);
  var json = { error: 'proxy_error', reason: error.message };
  if(res){
    if (!res.headersSent) {
      res.writeHead(500, { 'content-type': 'application/json' });
    }
    res.end(JSON.stringify(json));
  }
});

var path = function(req, res, next) {
  var namespace = req.params[0] || config.get('NAMESPACE');
  var podId     = req.params[1];
  var filePath  = req.params[2] || '';
  var pod_host  = "https://"+config.get('OPENSHIFT_SERVER');
  var qs        = url.parse(req.url).search
  req.url = '/api/v1/namespaces/'+namespace+'/pods/'+ podId +'/proxy/'+filePath
  if( qs && qs !== ''){
    req.url += qs;
  }
  req.headers.authorization = 'Bearer ' + config.get('OAUTH_TOKEN');
  //console.log("namespace, podid, filepath: " + namespace +" "+podId+" "+filePath)
  proxy.web(req, res, { target: pod_host });
  console.log('PROXY req.url', pod_host+'/'+req.url);
};

var directPath  = function(req, res, next){
  var namespace = config.get('NAMESPACE');
  var podIp     = req.params[0];
  var filePath  = req.params[1] || '';
  var pod_host  = "http://"+podIp+":8080";
  var qs        = url.parse(req.url).search
  req.url = filePath;
  if( qs && qs !== ''){
    req.url += qs;
  }
  if(config.get('ALLOWED_SUBNET')){
    var block = new Netmask(config.get('ALLOWED_SUBNET'));
    if( !block.contains(podIp) ){
      console.log('PROXY request FILTERED - req.url', pod_host+'/'+req.url);
    }
  }
  console.log('PROXY req.url', pod_host+'/'+req.url);
  proxy.web(req, res, { target: pod_host });
};

exports = module.exports = {
  'directPath': directPath,
  'path': path
};
