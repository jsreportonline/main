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
    logger.debug('Executing fop conversion')

    return new Promise((resolve, reject) => {
      request({
        url: reporter.options.workersUrl,
        method: 'POST',
        body: {
          tenant: req.tenant.name,
          containerType: 'f',
          data: {
            fo: res.content.toString()
          }
        },
        json: true
      }).on('error', (err) => reject(err)).on('response', (response) => {
        if (response.statusCode !== 200) {
          responseToBuffer(response, (err, data) => reject(new Error(data.toString())))
        } else {
          res.headers['Content-Type'] = 'application/pdf';
          res.headers['File-Extension'] = 'pdf';
          res.headers['Content-Disposition'] = 'inline; filename=\'report.pdf\'';

          responseToBuffer(response, (err, data) => {
            if (err) {
              return reject(err)
            }

            res.content = data
            resolve(res)
          })
        }
      })
    })
  }
}


