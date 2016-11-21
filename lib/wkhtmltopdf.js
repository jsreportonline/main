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
        case '--header-html':
        {
          promises.push(readFileAsync(args[i + 1].substring('file:///'.length)).then((content) => opts['header-html'] = content.toString()))
          break;
        }
        case '--footer-html':
        {
          promises.push(readFileAsync(args[i + 1].substring('file:///'.length)).then((content) => opts['footer-html'] = content.toString()))
          break;
        }
        case '--cover-html':
        {
          promises.push(readFileAsync(args[i + 1].substring('file:///'.length)).then((content) => opts['cover'] = content.toString()))
          break;
        }
        default:
        {
          if (i > 0 && args[i - 1] !== '--header-html' && args[i - 1] !== '--footer-html' && args[i - 1] !== '--cover') {
            opts.args.push(args[i])
          }
        }
      }
    }

    return Promise.all(promises).then(() => readFileAsync(html).then((content) => {
      opts.html = content.toString()

      return new Promise((resolve, reject) => {
        const body = {
          data: opts,
          tenant: req.tenant.name,
          containerType: 'w'
        }
        request({
          url: opts.wkhtmltopdfVersion !== '0.12.3-windows' ? reporter.options.workerUrl : reporter.options.windowsWorkerUrl,
          method: 'POST',
          body: body,
          json: true
        }).on('error', (err) => (err) => {
          reporter.errorNotification('wkhtmltopdf error - ' + req.tenant.name, JSON.stringify(body), err)
          reject(err)
        }).on('response', (response) => {
          responseToBuffer(response, (err, data) => {
            if (err) {
              reporter.errorNotification('wkhtmltopdf error - ' + req.tenant.name, JSON.stringify(body), err)
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
              resolve(data)
            } else {
              reporter.errorNotification('wkhtmltopdf error - ' + req.tenant.name, JSON.stringify(body), new Error(data.toString()))
              reject(new Error(data.toString()))
            }
          })
        })
      })
    }))
  }
}


