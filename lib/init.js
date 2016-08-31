var winston = require('winston')
var ScriptManager = require('./scriptsManager')
var phantom = require('./phantom')
var exec = require('child_process').exec
var request = require('request')
var routes = require('./routes')
var path = require('path')
var Repository = require('./multitenancyRepository')

module.exports = () => {
  var jsreport = require('jsreport-core')({
    loadConfig: true,
    rootDirectory: path.join(__dirname, '../')
  }).afterConfigLoaded(() => {
    jsreport.options.tasks.scriptManager = new ScriptManager(jsreport.options.tasks)
  })

  jsreport.use(require('jsreport-authentication')())
  jsreport.use(require('jsreport-data')())
  jsreport.use(require('jsreport-templates')())
  jsreport.use(require('jsreport-fs-store')())
  jsreport.use(require('jsreport-express')())
  jsreport.use(require('jsreport-phantom-pdf')())
  jsreport.use(require('jsreport-studio')())
  jsreport.use(require('jsreport-handlebars')())
  jsreport.use(require('jsreport-debug')())
  jsreport.use(require('jsreport-scripts')())
  jsreport.use(require('../mongo/mongo')())

  if (!jsreport.logger.transports.main) {
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
  }

  jsreport.multitenancyRepository = new Repository(jsreport)

  jsreport.on('before-express-configure', (app) => {
    routes(jsreport)
  })

  return jsreport.init().then(function () {
    for (var key in jsreport.documentStore.collections) {
      var col = jsreport.documentStore.collections[key]

      col.beforeFindListeners.add('multitenancy', (q, req) => (q.tenantId = req.tenant.name))
      col.beforeInsertListeners.add('multitenancy', (doc, req) => (doc.tenantId = req.tenant.name))
      col.beforeRemoveListeners.add('multitenancy', (q, req) => (q.tenantId = req.tenant.name))
      col.beforeUpdateListeners.add('multitenancy', (q, u, req) => (q.tenantId = req.tenant.name))
    }

    jsreport['phantom-pdf'].conversion = phantom(jsreport)

    return jsreport
  }).catch(function (e) {
    console.log(e.stack)
    throw e
  })
}

