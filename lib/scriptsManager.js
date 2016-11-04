const Promise = require('bluebird')
const requestAsync = Promise.promisify(require('request'))
const xlsx = require('./xlsx')

module.exports = (reporter) => {
  const restoreXlsxFiles = xlsx.restoreFiles(reporter.options.tempDirectory)

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
        if (httpResponse.body && httpResponse.statusCode === 400) {
          var e = new Error()
          e.message = httpResponse.body.error.message
          e.stack = httpResponse.body.error.stack
          e.weak = true
          return cb(e)
        }

        if (!httpResponse.body || httpResponse.statusCode !== 200) {
          throw new Error(httpResponse.body || 'Executing script failed')
        }

        if (inputs.engine && inputs.template.recipe === 'xlsx') {
          return restoreXlsxFiles(httpResponse.body)
        }


        return httpResponse.body
      }).then((res) => cb(null, res)).catch(cb)
    }
  }

  return new Manager()
}

