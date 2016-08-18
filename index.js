var exec = require('child_process').exec

var jsreport = require('jsreport-core')({ loadConfig: true })

jsreport.use(require('jsreport-data')())
jsreport.use(require('jsreport-templates')())
jsreport.use(require('jsreport-express')())
jsreport.use(require('jsreport-phantom-pdf')())
jsreport.use(require('jsreport-studio')())
jsreport.use(require('jsreport-handlebars')())
jsreport.use(require('jsreport-fs-store')())

jsreport.init().then(function() {

  jsreport.express.app.get('/api/foo', function (req, res) {
    exec('sudo /run-data/docker.sock', ['ps'], function (err, stdout, stderr) {
      res.send(err + stdout + stderr)
    })
  })

}).catch(function (e) {
  console.log(e.stack)
  throw e
})
