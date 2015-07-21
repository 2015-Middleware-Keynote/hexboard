var multipaas  = require('config-multipaas');
var autoconfig = function (config_overrides){
  var config   = multipaas(config_overrides).add({
    APP_NAME   : process.env.APPNAME || 'sketch'
  , OAUTH_TOKEN: process.env.ACCESS_TOKEN || false
  , ALLOWED_SUBNET : process.env.ALLOWED_SUBNET || false
  , NAMESPACE  : process.env.NAMESPACE || config.get('OPENSHIFT_BUILD_NAMESPACE')
  , OPENSHIFT_SERVER: process.env.OPENSHIFT_SERVER || 'localhost:8443' // openshift.default.svc.cluster.local
  , OPENSHIFT_APP_BASENAME: process.env.APP_ROOT_URL || 'localhost:8443'
  , BASIC_AUTH_USER: process.env.BASIC_AUTH_USER || ''
  , BASIC_AUTH_PASSWORD: process.env.BASIC_AUTH_PASSWORD || ''
  , HEXBOARD_SIZE: process.env.HEXBOARD_SIZE || 'xsmall' // xsmall, small, medium, large
  })
  config.add({
    PROXY      : process.env.PROXY || config.get('HOSTNAME')
  });
  return config;
}
exports = module.exports = autoconfig();
