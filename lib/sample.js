const fs = require('fs')
const path = require('path')

const samplePath = path.join(__dirname, 'sample')

module.exports = (documentStore, tenant) => {
  var dataObj = {
    name: 'Invoice data',
    tenantId: tenant.name,
    dataJson: fs.readFileSync(path.join(samplePath, 'data.json')).toString('utf8')
  }

  var scriptObj = {
    name: 'Invoice currency',
    tenantId: tenant.name,
    content: fs.readFileSync(path.join(samplePath, 'script.js')).toString('utf8')
  }

  var templateObj = {
    name: 'Invoice',
    tenantId: tenant.name,
    content: fs.readFileSync(path.join(samplePath, 'content.html')).toString('utf8'),
    helpers: fs.readFileSync(path.join(samplePath, 'helpers.js')).toString('utf8'),
    engine: 'handlebars',
    recipe: 'phantom-pdf'
  }

  var assetObj = {
    name: 'Invoice styles.css',
    tenantId: tenant.name,
    content: fs.readFileSync(path.join(samplePath, 'asset.css')).toString('utf8')
  }

  return documentStore.collection('data').insert(dataObj).then(function () {
    return documentStore.collection('scripts').insert(scriptObj).then(function () {
      return documentStore.collection('assets').insert(assetObj).then(function () {
        templateObj.data = {
          shortid: dataObj.shortid
        }

        templateObj.scripts = [{
          shortid: scriptObj.shortid
        }]

        return documentStore.collection('templates').insert(templateObj)
      })
    })
  })
}
