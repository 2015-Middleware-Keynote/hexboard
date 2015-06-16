'use strict';

var Rx = require('rx')
  , RxNode = require('rx-node')
  , split = require('split')
  , request = require('request')
  , _ = require('underscore')
  , PodParser = require('./pod-parser')
  ;

var tag = 'POD';

// Config
var config = {
  live: {
    oauthToken: process.env.ACCESS_TOKEN_LIVE || false,
    namespace: process.env.NAMESPACE_LIVE || 'demo1', //summit1
    openshiftServer: process.env.OPENSHIFT_SERVER_LIVE || 'openshift-master.summit2.paas.ninja:8443',
    proxy: process.env.PROXY_LIVE || 'http://sketch.demo.apps.summit2.paas.ninja'
  },
  preStart: {
    oauthToken: process.env.ACCESS_TOKEN_PRESTART || false,
    namespace: process.env.NAMESPACE_PRESTART || 'demo-test',  //summit2
    openshiftServer: process.env.OPENSHIFT_SERVER_PRESTART || 'openshift-master.summit3.paas.ninja:8443',
    // proxy: process.env.PROXY || 'http://openshiftproxy-bleathemredhat.rhcloud.com'
    proxy: process.env.PROXY_PRESTART || 'http://sketch.demo.apps.summit3.paas.ninja'
  }
};

// Allow self-signed SSL
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var buildWatchPodsUrl = function(server, namespace) {
  return 'https://' + server + '/api/v1beta3/watch/namespaces/' + namespace + '/pods';
};

var buildListPodsUrl = function(server, namespace) {
  return 'https://' + server + '/api/v1beta3/namespaces/' + namespace + '/pods';
};

var optionsBase = {
    method : 'get'
  , url    : null
  , qs     : {}
  , rejectUnauthorized: false
  , strictSSL: false
  , auth   : null
};

var environments = {
  live: {
    name: 'live'
  , listUrl: buildListPodsUrl(config.live.openshiftServer, config.live.namespace)
  , watchUrl: buildWatchPodsUrl(config.live.openshiftServer, config.live.namespace)
  , listOptions: _.defaults({
      url: buildListPodsUrl(config.live.openshiftServer, config.live.namespace),
      auth: {bearer:  config.live.oauthToken}
    }, optionsBase)
  , watchOptions: _.defaults({
      url: buildWatchPodsUrl(config.live.openshiftServer, config.live.namespace),
      auth: {bearer:  config.live.oauthToken}
    }, optionsBase)
  , state: {first  : true, pods: {}}
  , config: config.live
  , subjects: _.range(1026).map(function(index) {
      return new Rx.ReplaySubject(1);
    })
  }
, preStart: {
    name: 'preStart'
  , listUrl: buildListPodsUrl(config.preStart.openshiftServer, config.preStart.namespace)
  , watchUrl: buildWatchPodsUrl(config.preStart.openshiftServer, config.preStart.namespace)
  , listOptions: _.defaults({
      url: buildListPodsUrl(config.preStart.openshiftServer, config.preStart.namespace)
    , auth: {bearer:  config.preStart.oauthToken}
    }, optionsBase)
  , watchOptions: _.defaults({
      url: buildWatchPodsUrl(config.preStart.openshiftServer, config.preStart.namespace)
    , auth: {bearer:  config.preStart.oauthToken}
    }, optionsBase)
  , state: {first  : true, pods: {}}
  , config: config.preStart
  , subjects: _.range(1026).map(function(index) {
      return new Rx.ReplaySubject(1);
    })
  }
};

environments.live.parser = new PodParser(environments.live);
environments.preStart.parser = new PodParser(environments.preStart);

function verifyPodAvailable(parsed) {
  var pod = parsed.data;
  return Rx.Observable.create(function(observer) {
    var options = {
      url: pod.url + '/status'
    , method: 'get'
    }
    request(options, function(error, response, body) {
      if (!error && response && response.statusCode == 200) {
        if (pod.errorCount) {
          console.log(tag, 'Recovery (#', pod.errorCount, ')', parsed.object.metadata.name);
          delete(pod.errorCount);
        }
        observer.onNext(pod);
        observer.onCompleted();
      } else {
        var err = {
          code: response ? response.statusCode : ''
        , url: options.url
        , msg: error
        }
        observer.onError(err);
      };
    })
  })
  .retryWhen(function(errors) {
    var maxRetries = 20;
    return errors.scan(0, function(errorCount, err) {
      if (errorCount === 0) {
        console.log(tag, 'Error ', pod.url, ':', err);
      };
      if (err.code && (err.code === 401 || err.code === 403)) {
        return maxRetries;
      };
      pod.errorCount = ++errorCount;
      return errorCount;
    })
    .takeWhile(function(errorCount) {
      return errorCount < maxRetries;
    })
    .flatMap(function(errorCount) {
      return Rx.Observable.timer(errorCount * 250);
    });
  })
  .catch(Rx.Observable.empty());
};

var list = function(env) {
  return Rx.Observable.create(function(observer) {
    delete env.watchOptions.qs.latestResourceVersion;
    console.log(tag, 'list options', env.listOptions.url);
    var stream = request(env.listOptions, function(error, response, body) {
      if (error) {
        console.log(tag, 'error:',error);
        observer.onError(error);
      } else if (response && response.statusCode === 200) {
        var json = JSON.parse(body);
        json.timestamp = new Date();
        observer.onNext(json.items);
        observer.onCompleted();
      } else {
        observer.onError({
          code: response.statusCode
        , msg: body
        });
      }
    });
  })
  .flatMap(function(pods) {
    return pods;
  })
  .flatMap(function(object) {
    var pod = {type: 'List Result', object: object};
    env.watchOptions.qs.latestResourceVersion = pod.object.metadata.resourceVersion;
    var name = pod.object.metadata.name;
    var oldPod = env.state.pods[name];
    if (!oldPod || oldPod.object.metadata.resourceVersion != pod.object.metadata.resourceVersion) {
      env.state.pods[name] = pod;
      return [pod];
    }
    else {
      return [];
    }
  })
}

var watch = function(env) {
  return Rx.Observable.create(function(observer) {
    console.log(tag, 'list options', env.watchOptions.url, env.watchOptions.qs);
    var stream = request(env.watchOptions);
    stream.on('error', function(error) {
      console.log(tag, 'error:',error);
      observer.onError(error);
    });
    stream.on('end', function() {
      observer.onError({type: 'end', msg: 'Request terminated.'});
    });
    var lines = stream.pipe(split());
    stream.on('response', function(response) {
      if (response.statusCode === 200) {
        console.log(tag, 'Connection success', env.name);
        observer.onNext(lines)
      } else {
        response.on('data', function(data) {
          var message;
          try {
            var data = JSON.parse(data);
            message = data.message;
          } catch(e) {
            message = data.toString();
          }
          var error = {
            code: response.statusCode
          , message: message
          };
          if (error.code === 401 || error.code === 403) {
            error.type = 'auth';
          };
          console.log(tag, error);
          observer.onError(error);
        });
      };
    });
  })
  .flatMap(function(stream) {
    return RxNode.fromStream(stream)
  })
  .flatMap(function(data) {
    try {
      var pod = JSON.parse(data);
      pod.timestamp = new Date();
      var name = pod.object.metadata.name;
      var oldPod = env.state.pods[pod.object.metadata.name];
      if (!oldPod || oldPod.object.metadata.resourceVersion != pod.object.metadata.resourceVersion) {
        env.state.pods[name] = pod;
        return [pod];
      }
      else {
        return [];
      }
    } catch(e) {
      console.log(tag, 'JSON parsing error:', e);
      console.log(data);
      return [];
    }
  })
};

var listWatch = function(env) {
  return list(env).toArray().flatMap(function(pods) {
    if (pods.length) {
      var last = pods[pods.length - 1];
    }
    return Rx.Observable.merge(
      Rx.Observable.fromArray(pods)
    , watch(env)
    );
  });
};

var watchStream = function(env) {
  return listWatch(env).retryWhen(function(errors) {
    return errors.scan(0, function(errorCount, err) {
      console.log(tag, new Date());
      console.log(tag, 'Connection error:', err)
      if (err.type && err.type === 'end') {
        console.log(tag, 'Attmepting a re-connect (#' + errorCount + ')');
        return errorCount + 1;
      } else {
        throw err;
      }
    });
  })
};

var parseStream = function(env) {
  return watchStream(env).map(function(json) {
    return env.parser.parseData(json, true);
  })
  .filter(function(parsed) {
    return parsed && parsed.data && parsed.data.type && parsed.data.id <= 1025;
  })
}

var verifyStream = function(env) {
  return parseStream(env).flatMap(function(parsed) {
    if (parsed.data.stage != 4) {
      return Rx.Observable.just(parsed);
    } else {
      return Rx.Observable.merge(
        Rx.Observable.just(parsed)
      , verifyPodAvailable(parsed).map(function() {
          var newParsed = _.clone(parsed)
          newParsed.data = _.clone(parsed.data);
          newParsed.data.stage = 5;
          // env.state.pods[newParsed.object.metadata.name] = newParsed;
          return newParsed;
        })
      );
    };
  })
  .tap(function(pod) {
    var subject = env.subjects[pod.data.id];
    subject.onNext(pod);
    if (pod.data.stage === 0) {
      subject.onCompleted();
      env.subjects[pod.data.id] = new Rx.ReplaySubject(1);
    }
  })
  .publish();
};

verifyStream(environments.live).connect();
verifyStream(environments.preStart).connect();

module.exports = {
  liveStream: Rx.Observable.merge(environments.live.subjects)
, preStartStream: Rx.Observable.merge(environments.preStart.subjects)
};
