var exec = require('child_process').exec
var winston = require('winston')

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
  var out = ''
  jsreport.express.app.get('/api/foo', function (req, res) {
    var child = exec('ls', { cwd: '/run-data' }, function (err, stdout, stderr) {
      res.send(err + stdout + stderr)
    })
    child.on('data', (data) => out += data.toString())
    child.on('exit', () => res.send(out))
  })

}).catch(function (e) {
  console.log(e.stack)
  throw e
})
