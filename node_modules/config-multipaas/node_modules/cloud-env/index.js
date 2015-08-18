var defaults = {
  dev: {
    PORT: 8080,
    IP: '0.0.0.0',
    HOSTNAME: 'localhost',
    APP_NAME: 'APP_NAME',
    MONGODB_DB_URL: 'mongodb://127.0.0.1:27017',
    MONGODB_DB_HOST: '127.0.0.1',
    MONGODB_DB_PORT: 27017,
    MONGODB_DB_USERNAME: undefined,
    MONGODB_DB_PASSWORD: undefined,
    POSTGRESQL_DB_URL: 'postgresql://127.0.0.1:5432',
    POSTGRESQL_DB_HOST: '127.0.0.1',
    POSTGRESQL_DB_PORT: 5432,
    POSTGRESQL_DB_USERNAME: undefined,
    POSTGRESQL_DB_PASSWORD: undefined,
    MYSQL_DB_URL:  'mysql://127.0.0.1:3306',
    MYSQL_DB_HOST: '127.0.0.1',
    MYSQL_DB_PORT: 3306,
    MYSQL_DB_USERNAME: undefined,
    MYSQL_DB_PASSWORD: undefined,
  },
  cloud: {
    PORT: process.env.PORT,
    IP: process.env.BIND_IP,
    HOSTNAME: process.env.HOSTNAME,
    APP_NAME: process.env.APP_NAME,
    MONGODB_DB_URL: process.env.MONGODB_DB_URL,
    MONGODB_DB_HOST: process.env.MONGODB_DB_HOST,
    MONGODB_DB_PORT: process.env.MONGODB_DB_PORT,
    MONGODB_DB_USERNAME: process.env.MONGODB_DB_USERNAME,
    MONGODB_DB_PASSWORD: process.env.MONGODB_DB_PASSWORD,
    POSTGRESQL_DB_URL: process.env.POSTGRESQL_DB_URL,
    POSTGRESQL_DB_HOST: process.env.POSTGRESQL_DB_HOST,
    POSTGRESQL_DB_PORT: process.env.POSTGRESQL_DB_PORT,
    POSTGRESQL_DB_USERNAME: process.env.POSTGRESQL_DB_USERNAME,
    POSTGRESQL_DB_PASSWORD: process.env.POSTGRESQL_DB_PASSWORD,
    MYSQL_DB_URL:  process.env.MYSQL_DB_URL,
    MYSQL_DB_HOST: process.env.MYSQL_DB_HOST,
    MYSQL_DB_PORT: process.env.MYSQL_DB_PORT,
    MYSQL_DB_USERNAME: process.env.MYSQL_DB_USERNAME,
    MYSQL_DB_PASSWORD: process.env.MYSQL_DB_PASSWORD,
  },
  openshift: {
    PORT: process.env.OPENSHIFT_NODEJS_PORT,
    IP: process.env.OPENSHIFT_NODEJS_IP,
    HOSTNAME: process.env.OPENSHIFT_APP_DNS,
    APP_NAME: process.env.OPENSHIFT_APP_NAME,
    MONGODB_DB_URL: process.env.OPENSHIFT_MONGODB_DB_URL,
    MONGODB_DB_HOST: process.env.MONGODB_DB_HOST,
    MONGODB_DB_PORT: process.env.MONGODB_DB_PORT,
    MONGODB_DB_USERNAME: process.env.OPENSHIFT_MONGODB_DB_USERNAME,
    MONGODB_DB_PASSWORD: process.env.OPENSHIFT_MONGODB_DB_PASSWORD,
    POSTGRESQL_DB_URL: process.env.OPENSHIFT_POSTGRESQL_DB_URL,
    POSTGRESQL_DB_HOST: process.env.OPENSHIFT_POSTGRESQL_DB_HOST,
    POSTGRESQL_DB_PORT: process.env.OPENSHIFT_POSTGRESQL_DB_PORT,
    POSTGRESQL_DB_USERNAME: process.env.OPENSHIFT_POSTGRESQL_DB_USERNAME,
    POSTGRESQL_DB_PASSWORD: process.env.OPENSHIFT_POSTGRESQL_DB_PASSWORD,
    MYSQL_DB_URL: process.env.OPENSHIFT_MYSQL_DB_URL,
    MYSQL_DB_HOST: process.env.OPENSHIFT_MYSQL_DB_HOST,
    MYSQL_DB_PORT: process.env.OPENSHIFT_MYSQL_DB_PORT,
    MYSQL_DB_USERNAME: process.env.OPENSHIFT_MYSQL_DB_USERNAME,
    MYSQL_DB_PASSWORD: process.env.OPENSHIFT_MYSQL_DB_PASSWORD
  }
}

var find_key = function (key, default_key){
  return defaults.openshift[key] || defaults.cloud[key] || default_key || defaults.dev[key];
}

var resolve_config = function (){
  var env = {}
  for(var key in defaults.cloud){
    env[key] = find_key(key);
  }
  return env
}

var exports = module.exports = resolve_config();
exports.defaults = defaults
exports.get = find_key
