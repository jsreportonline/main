var winston = require('winston')
var ScriptManager = require('./scripts/manager')
var phantom = require('./recipes/phantom')

var jsreport = require('jsreport-core')({
  loadConfig: true
}).afterConfigLoaded(() => {
  jsreport.options.tasks.scriptManager = new ScriptManager(jsreport.options.tasks)
})

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
  jsreport['phantom-pdf'].conversion = phantom(jsreport.options)
}).catch(function (e) {
  console.log(e.stack)
  throw e
})
