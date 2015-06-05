var gulp = require('gulp')
  , env = require('node-env-file')
  ;

var envFile = process.env.NODE_ENV === 'production' ? 'production.env' : 'development.env';
env(__dirname + '/env/' + envFile);

var secretEnvFile = process.env.HOME + '/demo2015-ui.env';
try {
  secretEnvFile && env(secretEnvFile);
} catch(error) {
  // no env file to set.
}

var opts = require('./tasks/gulp-config.js')(gulp, {});

require('./tasks/bower.js')(gulp, opts);
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
