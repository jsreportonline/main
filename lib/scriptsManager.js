const Promise = require('bluebird')
const requestAsync = Promise.promisify(require('request'))
const xlsx = require('./xlsx')

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

      // wrong script are currently timing out
      if (inputs.script && (inputs.script.indexOf('beforeRender') === -1 && inputs.script.indexOf('afterRender') === -1)) {
        return cb(null, {
          request: inputs.request,
          response: inputs.response,
          shouldRunAfterRender: false,
          logs: [{
            timestamp: new Date(),
            level: 'warn',
            message: 'Skipping script, it doesn\'t contain beforeRender or afterRender'
          }]
        })
      }

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
          reporter.errorNotification('scriptmanager error', new Error(httpResponse.body || 'Executing script failed'))
          throw new Error(httpResponse.body || 'Executing script failed')
        }

        if (inputs.engine && inputs.template.recipe === 'xlsx') {
          return xlsx.restoreFiles(inputs.tasks.tempDirectory, httpResponse.body)
        }


        return httpResponse.body
      }).then((res) => cb(null, res)).catch(cb)
    }
  }

  return new Manager()
}

