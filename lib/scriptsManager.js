var Promise = require('bluebird')
var requestAsync = Promise.promisify(require('request'))

module.exports = (reporter) => {
  reporter.beforeRenderListeners.add('scripts-workaround', (req) => {
    if (req.template) {
      req.template.tenantId = req.tenant.name
    }
  })

  class Manager {

    ensureStarted (cb) {
      cb()
    }

    execute (inputs, options, cb) {
      const tenant = inputs.template ? inputs.template.tenantId : inputs.request.template.tenantId

      return requestAsync({
        method: 'POST',
        url: reporter.options.workerUrl,
        body: {
          tenant: tenant,
          containerType: 't',
          data: {
            inputs: inputs,
            options: options
          }
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
      }).then((res) => cb(null, res)).catch(cb)
    }
  }

  return new Manager()
}

