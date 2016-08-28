var winston = require('winston')
var ScriptManager = require('./scripts/manager')
var phantom = require('./recipes/phantom')
var exec = require('child_process').exec
var routes = require('./lib/routes')
var Repository = require('./lib/multitenancyRepository')

var jsreport = require('jsreport-core')({
  loadConfig: true
}).afterConfigLoaded(() => {
  jsreport.options.tasks.scriptManager = new ScriptManager(jsreport.options.tasks)
})

// jsreport.use(require('jsreport-authentication')())
jsreport.use(require('jsreport-data')())
jsreport.use(require('jsreport-templates')())
jsreport.use(require('jsreport-fs-store')())
jsreport.use(require('jsreport-express')())
jsreport.use(require('jsreport-phantom-pdf')())
jsreport.use(require('jsreport-studio')())
jsreport.use(require('jsreport-handlebars')())
jsreport.use(require('jsreport-debug')())
// jsreport.use(require('./mongo/mongo')())

jsreport.logger.add(winston.transports.File, {
  name: 'main',
  filename: 'reporter.log',
  maxsize: 10485760,
  json: false,
  level: 'debug'
})

jsreport.logger.add(winston.transports.Console, {
  level: 'debug'
})

// jsreport.multitenancyRepository = new Repository(jsreport)

jsreport.init().then(function () {
  jsreport.express.app.get('/run/:command', (req, res) => {
    exec(req.params.command, (err, stdout, stderr) => {
      res.send(err + stdout + stderr)
    })
  })
  /* for (var key in jsreport.documentStore.collections) {
    var col = jsreport.documentStore.collections[key]

    col.beforeFindListeners.add('multitenancy', (q, req) => (q.tenantId = req.tenant.name))
    col.beforeInsertListeners.add('multitenancy', (doc, req) => (doc.tenantId = req.tenant.name))
    col.beforeRemoveListeners.add('multitenancy', (q, req) => (q.tenantId = req.tenant.name))
    col.beforeUpdateListeners.add('multitenancy', (q, u, req) => (q.tenantId = req.tenant.name))
  } */

  jsreport['phantom-pdf'].conversion = phantom(jsreport.options)
}).catch(function (e) {
  console.log(e.stack)
  throw e
})
