// custom server side script used to fetch currencies from the remote API
// this can be used for example to load the whole dataset
const request = require('request')

function beforeRender (req, res, done) {
  request.get({ url: 'http://api.fixer.io/latest?base=USD', json: true }, function (err, resp, body) {
    if (err || resp.statusCode !== 200) {
      return done(err || body || 'Unknown error')
    }

    req.data.currency = body
    done()
  })
}
