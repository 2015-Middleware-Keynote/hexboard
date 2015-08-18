var cc            = require('config-chain'),
    cloud_env     = require('cloud-env')

var filterundefs = function(params){
  response = {}
  if( params && typeof params == 'object'){
    for(setting in params){
      if( params[setting] !== undefined ){
        response[setting] = params[setting];
      }
    }
  }
  return response
}

var get = function (key, where) {
  if (where) {
    where = this.sources[where]
    if (where) where = where.data
    if (where && Object.hasOwnProperty.call(where, key)) return where[key]
    return undefined
  }
  if (this.list[0][key] !== undefined) return this.list[0][key]
  if (Object.hasOwnProperty.call(cloud_env.defaults.dev, key)) return cloud_env.defaults.dev[key] 
  return undefined;
}

//return config-chain, with cloud config defaults included
var exports = module.exports = function () {
  var args = [].slice.call(arguments)
    , conf = new cc.ConfigChain()

  conf.get = get
  while(args.length) {
    var a = args.shift()
    if(a) conf.push
          ( 'string' === typeof a
            ? cc.json(a)
            : a )
  }

  return conf
    .add(cc.env('OPENSHIFT_NODEJS_'), 'openshift-nodejs')
    .add(cc.env('OPENSHIFT_'), 'openshift-env')
    .set('HOSTNAME', process.env.OPENSHIFT_APP_DNS, 'openshift-env')
    .add(filterundefs(cloud_env.defaults.cloud), 'cloud-defaults')
}

// Expose config-chain's interfaces via this module scope:
var cc_interfaces = ['find','parse','json','env','ConfigChain','on']
cc_interfaces.forEach(function(func){ exports[func] = cc[func]})
