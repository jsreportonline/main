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

      const body = {
        tenant: tenant,
        containerType: 't',
        data: {
          inputs: inputs,
          options: options
        }
      }

      return requestAsync({
        method: 'POST',
        url: reporter.options.workerUrl,
        body: body,
        json: true
      }).then((httpResponse) => {
        if (httpResponse.body && httpResponse.statusCode === 400) {
          var e = new Error()
          e.message = httpResponse.body.error.message
          e.stack = httpResponse.body.error.stack
          e.weak = true
          throw e
        }

        if (!httpResponse.body || httpResponse.statusCode !== 200) {
          throw new Error(httpResponse.body || 'Executing script failed')
        }

        if (inputs.engine && inputs.template.recipe === 'xlsx') {
          return xlsx.restoreFiles(inputs.tasks.tempDirectory, httpResponse.body)
        }

        return httpResponse.body
      }).then((res) => cb(null, res)).catch((err) => {
        if (err.weak === true) {
          return cb(err)
        }

        reporter.errorNotification('scriptmanager error - ' + tenant, JSON.stringify(body), err)

        if (err.code === 'ECONNRESET' || err.message.indexOf('socket hang up') !== -1) {
          return cb(new Error('The communication with your dedicated javascript container crashed. This is usually caused by reaching provided resources limits. The container is now about to be restarted.' + err.message))
        }

        cb(err)
      })
    }
  }

  return new Manager()
}
