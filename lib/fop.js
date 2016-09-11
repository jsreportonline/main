const WorkerManager = require('./workerManager')
const Promise = require('bluebird')
const request = require('request')
const path = require('path')
const readFileAsync = Promise.promisify(require('fs').readFile)
const stream = require('stream')
const logger = require('./logger')
const toArray = require('stream-to-array')

function responseToBuffer (response, cb) {
  toArray(response, (err, arr) => {
    cb(err, Buffer.concat(arr))
  })
}

module.exports = (reporter) => {
  const workerManager = new WorkerManager(reporter.options.fop)

  workerManager.executionFn((tenant, opts, url) => {

    return new Promise((resolve, reject) => {
      request({
        url: url,
        method: 'POST',
        body: {
          fo: opts.response.content.toString()
        },
        json: true
      }).on('error', (err) => reject(err)).on('response', (response) => {
        if (response.statusCode !== 200) {
          responseToBuffer(response, (err, data) => reject(new Error(data.toString())))
        } else {
          opts.response.headers['Content-Type'] = 'application/pdf';
          opts.response.headers['File-Extension'] = 'pdf';
          opts.response.headers['Content-Disposition'] = 'inline; filename=\'report.pdf\'';

          responseToBuffer(response, (err, data) => {
            opts.response.content = data
            resolve(opts.response)
          })
        }
      })
    })
  })

  return (request, response) => {
    logger.debug('Executing fop conversion')

    return workerManager.execute(request.tenant, { request: request, response: response })
  }
}


