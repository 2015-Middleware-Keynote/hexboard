var multipaas  = require('config-multipaas');
var autoconfig = function (config_overrides){
  var config   = multipaas(config_overrides).add({
    OAUTH_TOKEN: process.env.ACCESS_TOKEN || false
  , ADMIN_TOKEN: process.env.ADMIN_TOKEN || false
  , ALLOWED_SUBNET: process.env.ALLOWED_SUBNET || false
  , MOBILE_ENABLED: process.env.MOBILE_ENABLED || false
  , WINNER_COUNT: process.env.WINNER_COUNT || 10
  , NAMESPACE  : process.env.NAMESPACE || process.env.OPENSHIFT_BUILD_NAMESPACE || 'hexboard'
  , OPENSHIFT_SERVER: process.env.KUBERNETES_SERVICE_HOST || process.env.OPENSHIFT_SERVER || 'localhost:8443'
  , BASIC_AUTH_USER: process.env.BASIC_AUTH_USER || ''
  , BASIC_AUTH_PASSWORD: process.env.BASIC_AUTH_PASSWORD || ''
  , HEXBOARD_SIZE: process.env.HEXBOARD_SIZE || 'nano' // nano, micro, tiny, xsmall, small, medium, large, xlarge
  , PROXY: process.env.PROXY || ''
  })
  return config;
}
exports = module.exports = autoconfig();
