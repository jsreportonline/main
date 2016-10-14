const Promise = require('bluebird')
const request = require('request')
const fs = require('fs')
const uuid = require('uuid').v1
const path = require('path')
const logger = require('./logger')
const toArray = require('stream-to-array')

function responseToBuffer (response, cb) {
  toArray(response, (err, arr) => {
    cb(err, Buffer.concat(arr))
  })
}

module.exports = (reporter) => {
  return (req, res) => {
    logger.debug('Executing html to xlsx conversion')

    return new Promise((resolve, reject) => {
      request({
        url: reporter.options.workerUrl,
        method: 'POST',
        body: {
          tenant: req.tenant.name,
          containerType: 'h',
          data: res.content.toString()
        },
        json: true
      }).on('error', (err) => reject(err)).on('response', (response) => {
        if (response.statusCode !== 200) {
          responseToBuffer(response, (err, data) => reject(new Error(data.toString())))
        } else {
          // form data in responseXlsx doesn't want to send the response stream directly
          // as workaround we write it to file and pass the file stream
          const xlsxPath = path.join(reporter.options.tempDirectory, uuid() + '.xlsx')
          response.pipe(fs.createWriteStream(xlsxPath)).on('finish', () => {
            res.stream = fs.createReadStream(xlsxPath)
            reporter.xlsx.responseXlsx(req, res).then(resolve).catch(reject)
          })
        }
      })
    })
  }
}


