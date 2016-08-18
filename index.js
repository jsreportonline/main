var jsreport = require('jsreport-core')({ loadConfig: true })

jsreport.use(require('jsreport-data')())
jsreport.use(require('jsreport-templates')())
jsreport.use(require('jsreport-express')())
jsreport.use(require('jsreport-phantom-pdf')())
jsreport.use(require('jsreport-studio')())
jsreport.use(require('jsreport-handlebars')())
jsreport.use(require('jsreport-fs-store')())

jsreport.init().then(function() {
  console.log('running')
}).catch(function (e) {
  console.log(e.stack)
  throw e
})
