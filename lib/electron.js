const Promise = require('bluebird')
const request = require('request')
const toArray = require('stream-to-array')

function responseToBuffer (response, cb) {
  toArray(response, (err, arr) => {
    cb(err, Buffer.concat(arr))
  })
}

function numberOrUndefined (param) {
  if (!isNaN(param)) {
    return Number(param)
  }

  return undefined
}

function parseBoolean (param, defaultValue) {
  if (param === true || param === 'true') {
    return true
  } else if (param === false || param === 'false') {
    return false
  }

  return defaultValue
}

function parseIfJSON (val) {
  if (typeof val === 'object') {
    return val
  }

  try {
    return JSON.parse(val)
  } catch (e) {
    return val
  }
}

module.exports = (reporter) => {
  return (req, res) => {
    req.logger.debug('Executing electron conversion')

    return new Promise((resolve, reject) => {
      const options = req.template.electron || {}
      const data = {
        html: res.content.toString(),
        delay: numberOrUndefined(options.printDelay),
        waitForJS: parseBoolean(options.waitForJS, false),
        waitForJSVarName: 'JSREPORT_READY_TO_START',
        browserWindow: {
          width: numberOrUndefined(options.width),
          height: numberOrUndefined(options.height),
          webPreferences: {
            javascript: !parseBoolean(options.blockJavaScript, false)
          }
        },
        pdf: {
          marginsType: numberOrUndefined(options.marginsType),
          pageSize: parseIfJSON(options.format),
          printBackground: parseBoolean(options.printBackground, true),
          landscape: parseBoolean(options.landscape, false)
        }
      }

      const body = {
        tenant: req.tenant.name,
        containerType: 'e',
        data: data
      }
      request({
        url: reporter.options.workerUrl,
        method: 'POST',
        body: body,
        json: true
      }).on('error', (err) => {
        reporter.errorNotification('electron error - ' + req.tenant.name, JSON.stringify(body), err)
        reject(err)
      }).on('response', (response) => {
        responseToBuffer(response, (err, data) => {
          if (err) {
            reporter.errorNotification('electron error - ' + req.tenant.name, JSON.stringify(body), err)
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
            res.headers['Content-Type'] = 'application/pdf'
            res.headers['File-Extension'] = 'pdf'
            res.headers['Content-Disposition'] = 'inline; filename=\'report.pdf\''

            res.content = data
            resolve(res)
          } else {
            reporter.errorNotification('electron error - ' + req.tenant.name, JSON.stringify(body), new Error(data.toString()))

            var errorMessage = data.toString()

            if (errorMessage.indexOf('socket hang up') !== -1) {
              errorMessage = 'The communication with your dedicated electron container crashed. This is usually caused by reaching provided resources limits or electron unexpected fail. The container is now about to be restarted.' + errorMessage
            }
            reject(new Error(errorMessage))
          }
        })
      })
    })
  }
}
