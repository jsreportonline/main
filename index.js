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

  var ip
  jsreport.express.app.get('/ip', (req, res) => {
    var cmd = 'docker inspect --format \'{{ .NetworkSettings.IPAddress }}\' "test"'
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        return res.send(err)
      }
      ip = stdout.toString()
      res.send(stdout)
    })
  })

  jsreport.express.app.get('/pong', (req, res) => {
    request({
      method: 'GET',
      url: 'http://' + ip + ':1000'
    }).pipe(res)
  })

  jsreport.express.app.get('/ping', (req, res) => {
    request({
      method: 'GET',
      url: 'http://172.18.0.1:1000'
    }).pipe(res)
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
