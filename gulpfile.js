var gulp = require('gulp')
  , env = require('node-env-file')
  ;

var envFile;
switch (process.env.NODE_ENV_FILE || process.env.NODE_ENV) {
  case 'ec2':
    envFile = 'ec2.env';
    break;
  case 'production':
    envFile = 'production.env';
    break;
  case 'development':
  default:
    envFile = 'development.env';
    break;
}

console.log('Loading env file:', envFile);
env(__dirname + '/env/' + envFile);

var secretEnvFile = process.env.HOME + '/demo2015-ui.env';
try {
  secretEnvFile && env(secretEnvFile);
} catch(error) {
  console.log('Cannot load env file', secretEnvFile);
  // no env file to set.
}

var opts = require('./tasks/gulp-config.js')(gulp, {});

require('./tasks/styles.js')(gulp, opts);
require('./tasks/server.js')(gulp, opts);
require('./tasks/debug.js')(gulp, opts);
require('./tasks/test-backend.js')(gulp, opts);
require('./tasks/watch.js')(gulp, opts);

gulp.task('build', ['config', 'less']);
gulp.task('serve', ['node-start', 'build']);
gulp.task('debug', ['node-inspector', 'build']);

gulp.task('default', ['serve', 'watch-client']);

gulp.task('docker', ['serve', 'config']);
