var request = require('request')
var Promise = require('bluebird')
var exec = Promise.promisify(require('child_process').exec)
var requestAsync = Promise.promisify(require('request'))

var Manager = module.exports = function (options) {
  this.options = options
}

Manager.prototype.ensureStarted = function (cb) {
  cb()
}

const ping = function (url) {
  const fn = (retry) => {
    console.log('ping ' + url)

    return requestAsync(url).catch((e) => {
      console.log(e)
      if (retry < 1000) {
        return Promise.delay(10).then(() => fn(retry + 1))
      }

      throw e
    })
  }

  return fn(0)
}

const remove = function () {
  console.log('remove')
  return exec('docker rm -f test').catch(() => {})
}

const run = function () {
  console.log('run')
  return exec('docker run -d --name test -p 1000:3000 jsreportonline/tasks')
}

const getIP = function () {
  console.log('get ip')

  return '172.18.0.1'

  return exec("ifconfig | sed -En 's/127.0.0.1//;s/.*inet (addr:)?(([0-9]*\\.){3}[0-9]*).*/\\2/p'").then((stdout) => {
    console.log('ip ' + stdout.toString())
    return stdout.toString().split('\n')[0].replace(/^\s+|\s+$/g, '')
  })
}

Manager.prototype.execute = function (inputs, options, cb) {
  request({
    method: 'POST',
    url: this.options.workerUrl,
    body: {
      inputs: inputs,
      options: options
    },
    json: true
  }, function (err, httpResponse, body) {
    if (err) {
      return cb(err)
    }

    if (!body || httpResponse.statusCode !== 200) {
      return cb(new Error(body || 'Executing script failed'))
    }

    if (body.error) {
      var e = new Error()
      e.message = body.error.message
      e.stack = body.error.stack
      e.weak = true
      return cb(e)
    }

    cb(null, body)
  })
}

/*Manager.prototype.execute = function (inputs, options, cb) {
  return remove().then(run).then(getIP).then((ip) => {
    const url = `http://${ip}:1000`

    return ping(url).then(() => requestAsync({
      method: 'POST',
      url: url,
      body: {
        inputs: inputs,
        options: options
      },
      json: true
    }).then((httpResponse) => {
      if (!httpResponse.body || httpResponse.statusCode !== 200) {
        throw new Error(httpResponse.body || 'Executing script failed')
      }
      if (httpResponse.body.error) {
        var e = new Error()
        e.message = httpResponse.body.error.message
        e.stack = httpResponse.body.error.stack
        e.weak = true
        throw e
      }

      return httpResponse.body
    }))
  }).then((v) => cb(null, v)).catch(cb)
}*/
