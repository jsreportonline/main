const Promise = require('bluebird')
const request = require('request')
const readFileAsync = Promise.promisify(require('fs').readFile)
const toArray = require('stream-to-array')

function responseToBuffer (response, cb) {
  toArray(response, (err, arr) => {
    cb(err, Buffer.concat(arr))
  })
}

module.exports = (reporter) => {
  reporter.wkhtmltopdf.wkhtmltopdfVersions.push({
    version: '0.12.3-windows',
    path: 'wkhtmltopdf'
  })

  return (args, req) => {
    req.logger.debug('Executing wkhtmltopdf conversion')

    // pdf output file is not relevant
    args.pop()

    const html = args.pop()

    const opts = {
      args: [],
      recipe: 'wkhtmltopdf',
      wkhtmltopdfVersion: req.template.wkhtmltopdf.wkhtmltopdfVersion
    }

    var promises = []

    for (var i = 0; i < args.length; i++) {
      switch (args[i]) {
        case '--header-html': {
          promises.push(readFileAsync(args[i + 1].substring('file:///'.length)).then((content) => (opts['header-html'] = content.toString())))
          break
        }
        case '--footer-html': {
          promises.push(readFileAsync(args[i + 1].substring('file:///'.length)).then((content) => (opts['footer-html'] = content.toString())))
          break
        }
        case '--cover-html': {
          promises.push(readFileAsync(args[i + 1].substring('file:///'.length)).then((content) => (opts['cover'] = content.toString())))
          break
        }
        default: {
          if (i > 0 && args[i - 1] !== '--header-html' && args[i - 1] !== '--footer-html' && args[i - 1] !== '--cover') {
            opts.args.push(args[i])
          }
        }
      }
    }

    return Promise.all(promises).then(() => readFileAsync(html).then((content) => {
      opts.html = content.toString()

      const body = {
        data: opts,
        isWin: opts.wkhtmltopdfVersion === '0.12.3-windows',
        tenant: req.tenant.name,
        containerType: 'w'
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
              resolve(data)
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

        reporter.errorNotification('wkhtmltopdf error - ' + req.tenant.name, JSON.stringify(body), err)

        if (err.code === 'ECONNRESET' || err.message.indexOf('socket hang up') !== -1) {
          throw new Error('The communication with your dedicated wkhtmltopdf container crashed. This is usually caused by reaching provided resources limits or wkhtmltopdf unexpected fail. The container is now about to be restarted.' + err.message)
        }

        throw err
      })
    }))
  }
}
