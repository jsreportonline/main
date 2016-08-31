var WorkerManager = require('./workerManager')
var Promise = require('bluebird')
var requestAsync = Promise.promisify(require('request'))
var stream = require('stream')

module.exports = (reporter) => {
  const workerManager = new WorkerManager(reporter.options.phantom)
  reporter.afterTemplatingEnginesExecutedListeners.add('phantom', (req) => {
    if (req.template && req.template.recipe === 'phantom-pdf') {
      req.template.phantom = req.template.phantom || {}
      req.template.phantom.tenant = req.tenant.name
    }
  })

  workerManager.executionFn((tenant, body, url) => requestAsync({
    url: url,
    method: 'POST',
    body: body,
    json: true
  }).then((httpResponse) => {
    if (!httpResponse.body || httpResponse.statusCode !== 200) {
      throw new Error(httpResponse.body || 'Phantomjs rendering failed')
    }

    if (httpResponse.body.error) {
      var e = new Error()
      e.message = httpResponse.body.error.message
      e.stack = httpResponse.body.error.stack
      e.weak = true
      throw e
    }

    var bufferStream = new stream.PassThrough()
    bufferStream.end(new Buffer(httpResponse.body.content, 'base64'))
    return {
      logs: httpResponse.body.logs.map((m) => Object.assign(m, { timestamp: new Date(m.timestamp) })),
      numberOfPages: httpResponse.body.numberOfPages,
      stream: bufferStream
    }
  }))

  return (opts, cb) => {
    workerManager.execute(opts.tenant, opts).then((res) => {
      cb(null, res)
    }).catch(cb)
  }
}


