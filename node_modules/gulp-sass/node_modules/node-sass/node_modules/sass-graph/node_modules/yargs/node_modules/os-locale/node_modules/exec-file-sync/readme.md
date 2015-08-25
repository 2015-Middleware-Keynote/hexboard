# exec-file-sync [![Build Status](https://travis-ci.org/sindresorhus/exec-file-sync.svg?branch=master)](https://travis-ci.org/sindresorhus/exec-file-sync)

> Node.js 0.12 [`childProcess.execFileSync()`](https://nodejs.org/api/child_process.html#child_process_child_process_execfilesync_command_args_options) ponyfill

> Ponyfill: A polyfill that doesn't overwrite the native method

*Doesn't require node-gyp compilation or anything like that.*


## Install

```
$ npm install --save exec-file-sync
```


## Usage

```js
var execFileSync = require('exec-file-sync');

console.log(execFileSync('echo', ['unicorn']).toString().trim());
//=> 'unicorn'
```


## License

MIT © [Sindre Sorhus](http://sindresorhus.com)
