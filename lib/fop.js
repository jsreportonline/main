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
  return (req, res) => {
    req.logger.debug('Executing fop conversion')

    return new Promise((resolve, reject) => {
      const body = {
        tenant: req.tenant.name,
        containerType: 'f',
        data: {
          fo: res.content.toString()
        }
      }
      request({
        url: reporter.options.workerUrl,
        method: 'POST',
        body: body,
        json: true
      }).on('error', (err) => {
        reporter.errorNotification('fop error - ' + req.tenant.name, JSON.stringify(body), err)
        reject(err)
      }).on('response', (response) => {
        responseToBuffer(response, (err, data) => {
          if (err) {
            reporter.errorNotification('fop error - ' + req.tenant.name, JSON.stringify(body), err)
            return reject(err)
          }

          if (response.statusCode === 400) {
            const err = JSON.parse(data.toString())
            var e = new Error()
            e.message = err.error.message
            e.stack = err.error.stack
            e.weak = true
            return reject(e)
          }

          if (response.statusCode === 200) {
            res.headers['Content-Type'] = 'application/pdf';
            res.headers['File-Extension'] = 'pdf';
            res.headers['Content-Disposition'] = 'inline; filename=\'report.pdf\'';


            res.content = data
            resolve(res)
          } else {
            reporter.errorNotification('fop error - ' + req.tenant.name, JSON.stringify(body), new Error(data.toString()))

            var errorMessage = data.toString()

            if  (errorMessage.indexOf('socket hang up') !== -1) {
              errorMessage = 'The communication with your dedicated fop container crashed. This is usually caused by reaching provided resources limits or fop unexpected fail. The container is now about to be restarted.' + errorMessage
            }
            reject(new Error(errorMessage))
          }
        })
      })
    })
  }
}


