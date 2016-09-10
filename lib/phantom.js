var WorkerManager = require('./workerManager')
var Promise = require('bluebird')
var requestAsync = Promise.promisify(require('request'))
var stream = require('stream')
var logger = require('./logger')

module.exports = (reporter) => {
  const workerManager = new WorkerManager(reporter.options.phantom)
  reporter.options.phantom.phantoms.push({
    version: '1.9.8-windows',
    path: 'phantomjs'
  })

  reporter.afterTemplatingEnginesExecutedListeners.add('phantom', (req) => {
    if (req.template && req.template.recipe === 'phantom-pdf') {
      req.template.phantom = req.template.phantom || {}
      req.template.phantom.tenant = req.tenant.name
    }
  })

  workerManager.executionFn((tenant, body, url) => {
    return requestAsync({
      url: body.phantomjsVersion === '1.9.8-windows' ? reporter.options.phantom.windowsWorkerUrl : url,
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
    })
  })

  return (opts, cb) => {
    logger.debug('Executing phantom pdf conversion')
    workerManager.execute(opts.tenant, opts).then((res) => {
      cb(null, res)
    }).catch(cb)
  }
}


