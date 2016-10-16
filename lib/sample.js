const fs = require('fs')
const path = require('path')

const samplePath = path.join(__dirname, '../node_modules/jsreport-sample-template/lib/sample')

module.exports = (documentStore, tenant) => {
  var dataObj = {
    name: 'Sample data',
    tenantId: tenant.name,
    dataJson: fs.readFileSync(path.join(samplePath, 'data.js')).toString('utf8')
  }

  var scriptObj = {
    name: 'Sample script',
    tenantId: tenant.name,
    content: fs.readFileSync(path.join(samplePath, 'script.js')).toString('utf8')
  }

  var templateObj = {
    name: 'Sample report',
    tenantId: tenant.name,
    content: fs.readFileSync(path.join(samplePath, 'sample.html')).toString('utf8'),
    helpers: fs.readFileSync(path.join(samplePath, 'helpers.js')).toString('utf8'),
    engine: 'handlebars',
    recipe: 'phantom-pdf',
    phantom: {
      header: "<h1 style='background-color:lightGray'>Library monthly report</h1>",
      phantomjsVersion: '1.9.8',
      footer: 'Generated on {{generatedOn}}'
    }
  }

  return documentStore.collection('data').insert(dataObj).then(function () {
    return documentStore.collection('scripts').insert(scriptObj).then(function () {
      templateObj.data = {
        shortid: dataObj.shortid
      }
      templateObj.scripts = [{ shortid: scriptObj.shortid }]

      return documentStore.collection('templates').insert(templateObj)
    })
  })
}
