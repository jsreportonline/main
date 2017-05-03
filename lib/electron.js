
const Promise = require('bluebird')
const requestAsync = Promise.promisify(require('request'))

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

      resolve(
        requestAsync({
          url: reporter.options.workerUrl,
          method: 'POST',
          body: body,
          json: true
        }).then((httpResponse) => {
          if (httpResponse.statusCode === 400) {
            const err = JSON.parse(data.toString())
            var e = new Error()
            e.message = err.error.message
            e.stack = err.error.stack
            e.weak = true
            throw e
          }

          if (!httpResponse.body || httpResponse.statusCode !== 200) {
            throw new Error(httpResponse.body || 'electron rendering failed')
          }

          res.headers['Content-Type'] = 'application/pdf'
          res.headers['File-Extension'] = 'pdf'
          res.headers['Content-Disposition'] = 'inline; filename=\'report.pdf\''
          res.headers['Number-Of-Pages'] = httpResponse.body.numberOfPages

          res.logs = httpResponse.body.logs.map((m) => Object.assign(m, { timestamp: new Date(m.timestamp) }))

          res.logs.forEach((msg) => {
            req.logger[msg.level](msg.message, { timestamp: msg.timestamp })
          })

          res.content = new Buffer(httpResponse.body.content, 'base64')

          return res
        }).catch((err) => {
          if (err.weak === true) {
            throw err
          }

          reporter.errorNotification('electron error - ' + req.tenant.name, JSON.stringify(body), err)

          if (err.code === 'ECONNRESET' || err.message.indexOf('socket hang up') !== -1) {
            throw new Error('The communication with your dedicated electron container crashed. This is usually caused by reaching provided resources limits or electron unexpected fail. The container is now about to be restarted.' + err.message)
          }

          throw err
        })
      )
    })
  }
}
