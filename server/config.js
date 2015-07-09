var multipaas  = require('config-multipaas');
var autoconfig = function (config_overrides){
  var config   = multipaas(config_overrides).add({
    APP_NAME   : process.env.APPNAME || 'sketch'
  , OAUTH_TOKEN: process.env.ACCESS_TOKEN || false
  , ALLOWED_SUBNET : process.env.ALLOWED_SUBNET || false
  , NAMESPACE  : process.env.NAMESPACE || 'demo'
  , OPENSHIFT_SERVER: process.env.OPENSHIFT_SERVER || 'openshift-master.summit.paas.ninja:8443'
  , OPENSHIFT_APP_BASENAME: process.env.APP_ROOT_URL || 'apps.summit.paas.ninja:8443'
  , BASIC_AUTH_USER: process.env.BASIC_AUTH_USER || ''
  , BASIC_AUTH_PASSWORD: process.env.BASIC_AUTH_PASSWORD || ''
  })
  config.add({
    PROXY      : process.env.PROXY || config.get('HOSTNAME')
  });
  return config;
}
exports = module.exports = autoconfig();
