var Promise = require('bluebird')
var requestAsync = Promise.promisify(require('request'))
var stream = require('stream')
var logger = require('./logger')

const defaultPhantomjsChange = new Date(2016, 9, 18)

module.exports = (reporter) => {
  reporter.options.phantom.phantoms.push({
    version: '1.9.8-windows',
    path: 'phantomjs'
  })

  reporter.afterTemplatingEnginesExecutedListeners.add('phantom', (req) => {
    if (req.template && req.template.recipe === 'phantom-pdf') {
      req.template.phantom = req.template.phantom || {}
      req.template.phantom.tenant = req.tenant.name

      // anonymous requests for old tenants should get the windows fallback
      req.template.phantom.isWin = (req.template.phantom.phantomjsVersion === '1.9.8-windows' || (!req.template.phantom.phantomjsVersion && req.tenant.createdOn < defaultPhantomjsChange))
    }
  })

  return (opts, cb) => {
    logger.debug('Executing phantom pdf conversion', { tenant: opts.tenant })
    var body = {
      tenant: opts.tenant,
      isWin: opts.isWin,
      containerType: 'p',
      data: opts
    }

    return requestAsync({
      url: reporter.options.workerUrl,
      method: 'POST',
      body: body,
      json: true
    }).then((httpResponse) => {
      if (httpResponse.body && httpResponse.statusCode === 400) {
        var e = new Error()
        e.message = httpResponse.body.error.message
        e.stack = httpResponse.body.error.stack
        e.weak = true
        return cb(e)
      }

      if (!httpResponse.body || httpResponse.statusCode !== 200) {
        reporter.errorNotification('phantomjs error - ' + body.tenant, JSON.stringify(body), new Error(httpResponse.body || 'Phantomjs rendering failed'))

        if (httpResponse.body && httpResponse.body.toString().indexOf('socket hang up') !== -1) {
          throw new Error('The communication with your dedicated phantomjs container crashed. This is usually caused by reaching provided resources limits or phantomjs unexpected fail. The container is now about to be restarted.' + httpResponse.body)
        }

        throw new Error(httpResponse.body || 'Phantomjs rendering failed')
      }

      var bufferStream = new stream.PassThrough()
      bufferStream.end(new Buffer(httpResponse.body.content, 'base64'))
      return {
        logs: httpResponse.body.logs.map((m) => Object.assign(m, { timestamp: new Date(m.timestamp) })),
        numberOfPages: httpResponse.body.numberOfPages,
        stream: bufferStream
      }
    }).then((res) => cb(null, res)).catch(cb)
  }
}
