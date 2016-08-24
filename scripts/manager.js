var request = require('request')

var Manager = module.exports = function (options) {
  this.options = options
}

Manager.prototype.ensureStarted = function (cb) {
  cb()
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
