const fs = require('fs')
const path = require('path')

const samplePath = path.join(__dirname, 'sample')

module.exports = async (documentStore, tenant) => {
  const dataObj = {
    name: 'Invoice data',
    tenantId: tenant.name,
    dataJson: fs.readFileSync(path.join(samplePath, 'data.json')).toString('utf8')
  }

  const templateObj = {
    name: 'Invoice',
    tenantId: tenant.name,
    content: fs.readFileSync(path.join(samplePath, 'content.html')).toString('utf8'),
    helpers: fs.readFileSync(path.join(samplePath, 'helpers.js')).toString('utf8'),
    engine: 'handlebars',
    recipe: 'chrome-pdf',
    chrome: {
      printBackground: true
    }
  }

  const assetObj = {
    name: 'Invoice styles.css',
    tenantId: tenant.name,
    content: fs.readFileSync(path.join(samplePath, 'asset.css')).toString('utf8')
  }

  await documentStore.collection('data').insert(dataObj)
  await documentStore.collection('assets').insert(assetObj)

  templateObj.data = {
    shortid: dataObj.shortid
  }

  return documentStore.collection('templates').insert(templateObj)
}
