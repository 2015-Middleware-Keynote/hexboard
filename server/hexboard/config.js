var multipaas  = require('config-multipaas');
var autoconfig = function (config_overrides){
  var config   = multipaas(config_overrides).add({
    app_name   : process.env.APPNAME || 'sketch'
  , oauth_token: process.env.ACCESS_TOKEN || false
  , allowed_subnet : process.env.ALLOWED_SUBNET || false
  , namespace  : process.env.NAMESPACE || 'demo'
  , openshift_server: process.env.OPENSHIFT_SERVER || 'openshift-master.summit.paas.ninja:8443'
  , openshift_app_basename: process.env.APP_ROOT_URL || 'apps.summit.paas.ninja:8443'
  })
  config.add({
    proxy      : process.env.PROXY || config.get('HOSTNAME')
  });
  return config;
}
exports = module.exports = autoconfig();
