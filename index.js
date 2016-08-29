var winston = require('winston')
var ScriptManager = require('./scripts/manager')
var phantom = require('./recipes/phantom')
var exec = require('child_process').exec
var request = require('request')
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

  jsreport.express.app.get('/test', (req, res) => {
    var cmd = 'docker run -d --name test -p 1000:3000 jsreportonline/tasks'
    exec(cmd, (err, stdout, stderr) => {
      res.send(err + stdout + stderr)
    })
  })

  jsreport.express.app.get('/del', (req, res) => {
    var cmd = 'docker rm test'
    exec(cmd, (err, stdout, stderr) => {
      res.send(err + stdout + stderr)
    })
  })

  jsreport.express.app.get('/ping', (req, res) => {
    request({
      method: 'POST',
      url: 'http://localhost:1000',
      body: {'inputs':{'template':{'__entitySet':'templates','shortid':'SyFCEdWo','name':'test','recipe':'phantom-pdf','engine':'handlebars','__isDirty':'true','__isNew':'true','__name':'test','content':'Hello world','pathToEngine':'e:\\work\\jsreportonline\\main\\node_modules\\jsreport-handlebars\\lib\\handlebarsEngine.js'},'data':{},'engine':'e:\\work\\jsreportonline\\tasks\\scripts\\handlebarsEngine.js','appDirectory':'e:\\work\\jsreportonline\\main','rootDirectory':'e:\\work\\jsreportonline\\main\\','parentModuleDirectory':'e:\\work\\jsreportonline\\main','tasks':{'workerUrl':'http://localhost:3000','scriptManager':{'options':'[Circular ~.inputs.tasks]'},'strategy':'dedicated-process','tempDirectory':'C:\\Users\\JANBLA~1\\AppData\\Local\\Temp\\jsreport-temp','nativeModules':[{'globalVariableName':'handlebars','module':'e:\\work\\jsreportonline\\main\\node_modules\\handlebars'}]}},'options':{'execModulePath':'e:\\work\\jsreportonline\\tasks\\scripts\\engineScript.js'}},
      json: true
    }, function (err, httpResponse, body) {
      if (err) {
        return res.send(err)
      }

      if (!body || httpResponse.statusCode !== 200) {
        return res.send(new Error(body || 'Executing script failed'))
      }

      if (body.error) {
        var e = new Error()
        e.message = body.error.message
        e.stack = body.error.stack
        e.weak = true
        return res.send(e)
      }

      res.send(body)
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
