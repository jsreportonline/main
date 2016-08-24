var winston = require('winston')
var request = require('request')

var jsreport = require('jsreport-core')({ loadConfig: true })

jsreport.use(require('jsreport-data')())
jsreport.use(require('jsreport-templates')())
jsreport.use(require('jsreport-express')())
jsreport.use(require('jsreport-phantom-pdf')())
jsreport.use(require('jsreport-studio')())
jsreport.use(require('jsreport-handlebars')())
jsreport.use(require('./mongo/mongo')())

jsreport.logger.add(winston.transports.File, {
  name: 'main',
  filename: 'reporter.log',
  maxsize: 10485760,
  json: false,
  level: 'debug'
})

jsreport.init().then(function () {
  jsreport.express.app.get('/api/foo', function (req, res) {
    request('http://tasks:3000').pipe(res)
  })
}).catch(function (e) {
  console.log(e.stack)
  throw e
})
