const Promise = require('bluebird')
const request = require('request')
const fs = require('fs')
const uuid = require('uuid').v1
const path = require('path')
const toArray = require('stream-to-array')

function responseToBuffer (response, cb) {
  toArray(response, (err, arr) => {
    cb(err, Buffer.concat(arr))
  })
}

module.exports = (reporter) => {
  return (req, res) => {
    req.logger.debug('Executing html to xlsx conversion')

    const body = {
      tenant: req.tenant.name,
      containerType: 'h',
      data: res.content.toString()
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
        if (response.statusCode !== 200) {
          return responseToBuffer(response, (err, data) => {
            if (err) {
              return reject(err)
            }

            if (response.statusCode !== 400) {
              return reject(new Error(data.toString()))
            }

            const parsedErr = JSON.parse(data.toString())
            var e = new Error()
            e.message = parsedErr.error.message
            e.stack = parsedErr.error.stack
            e.weak = true
            return reject(e)
          })
        }

        // form data in responseXlsx doesn't want to send the response stream directly
        // as workaround we write it to file and pass the file stream
        const xlsxPath = path.join(reporter.options.tempDirectory, uuid() + '.xlsx')
        response.pipe(fs.createWriteStream(xlsxPath)).on('finish', () => {
          res.stream = fs.createReadStream(xlsxPath)
          reporter.xlsx.responseXlsx(req, res).then(resolve).catch(reject)
        })
      })
    }).catch((err) => {
      if (err.weak === true) {
        throw err
      }

      reporter.errorNotification('html to xlsx error - ' + req.tenant.name, JSON.stringify(body), err)

      if (err.code === 'ECONNRESET' || err.message.indexOf('socket hang up') !== -1) {
        throw new Error('The communication with your dedicated html-to-xlsx container crashed. This is usually caused by reaching provided resources limits or html-to-xlsx unexpected fail. The container is now about to be restarted.' + err.message)
      }

      throw err
    })
  }
}
