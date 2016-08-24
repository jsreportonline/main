var request = require('request')
var concat = require('concat-stream')

module.exports = function (options) {
  return function (opt, cb) {
    var responseStream = request.post({
      url: options.phantom.workerUrl,
      body: JSON.stringify(opt)
    })

    responseStream.on('error', function (err) {
      cb(err)
    })

    responseStream.on('response', function (response) {
      response.on('error', function (err) {
        cb(err)
      })

      if (response.statusCode !== 200) {
        return responseToBuffer(response, function (data) {
          var err = new Error('phantomjs rendering failed ' + response.statusCode)
          err.response = data
          cb(err)
        })
      }

      cb(null, {
        logs: [],
        numberOfPages: 5,
        stream: responseStream
      })
    })
  }
}

function responseToBuffer (response, cb) {
  var writeStream = concat(cb)
  response.pipe(writeStream)
}

