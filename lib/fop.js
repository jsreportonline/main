const Promise = require('bluebird')
const request = require('request')
const toArray = require('stream-to-array')

function responseToBuffer (response, cb) {
  toArray(response, (err, arr) => {
    cb(err, Buffer.concat(arr))
  })
}

module.exports = (reporter) => {
  return (req, res) => {
    req.logger.debug('Executing fop conversion')

    const body = {
      tenant: req.tenant.name,
      containerType: 'f',
      data: {
        fo: res.content.toString()
      }
    }

    return new Promise((resolve, reject) => {
      request({
        url: reporter.options.workerUrl,
        method: 'POST',
        body: body,
        json: true
      }).on('error', (err) => {
        reject(err)
      }).on('response', (response) => {
        responseToBuffer(response, (err, data) => {
          if (err) {
            return reject(err)
          }

          if (response.statusCode === 400) {
            const workerErr = JSON.parse(data.toString())
            var e = new Error()
            e.message = workerErr.error.message
            e.stack = workerErr.error.stack
            e.weak = true
            return reject(e)
          }

          if (response.statusCode === 200) {
            res.headers['Content-Type'] = 'application/pdf'
            res.headers['File-Extension'] = 'pdf'
            res.headers['Content-Disposition'] = 'inline; filename=\'report.pdf\''

            res.content = data
            resolve(res)
          } else {
            var errorMessage = data.toString()
            reject(new Error(errorMessage))
          }
        })
      })
    }).catch((err) => {
      if (err.weak === true) {
        throw err
      }

      reporter.errorNotification('fop error - ' + req.tenant.name, JSON.stringify(body), err)

      if (err.code === 'ECONNRESET' || err.indexOf('socket hang up') !== -1) {
        throw new Error('The communication with your dedicated fop container crashed. This is usually caused by reaching provided resources limits or fop unexpected fail. The container is now about to be restarted.' + err.message)
      }

      throw err
    })
  }
}
