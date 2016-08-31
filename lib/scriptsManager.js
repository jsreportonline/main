var Promise = require('bluebird')
var WorkerManager = require('./workerManager')
var requestAsync = Promise.promisify(require('request'))

module.exports = class Manager {
  constructor (options) {
    this.workerManager = new WorkerManager(options)
    this.workerManager.executionFn(this._execute)
  }

  ensureStarted (cb) {
    cb()
  }

  _execute (tenant, body, url) {
    return requestAsync({
      method: 'POST',
      url: this.workerUrls[0],
      body: {
        inputs: body.inputs,
        options: body.options
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
    })
  }

  execute (inputs, options, cb) {
    const tenant = inputs.template ? inputs.template.tenantId : inputs.request.template.tenantId
    this.workerManager.execute(tenant, { inputs: inputs, options: options }).then((r) => cb(null, r)).catch(cb)
  }
}