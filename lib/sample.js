const fs = require('fs')
const path = require('path')
const Request = require('jsreport-core').Request

const samplePath = path.join(__dirname, 'sample')

module.exports = async (documentStore, tenant) => {
  const currentRequest = Request({
    context: {
      tenant,
      skipAuthorization: true
    }
  })

  const folder = await documentStore.collection('folders').insert({
    name: 'Invoice',
    tenantId: tenant.name
  }, currentRequest)

  const dataObj = {
    name: 'invoice-data',
    tenantId: tenant.name,
    dataJson: fs.readFileSync(path.join(samplePath, 'data.json')).toString('utf8'),
    folder: {
      shortid: folder.shortid
    }
  }

  const templateObj = {
    name: 'invoice-main',
    tenantId: tenant.name,
    content: fs.readFileSync(path.join(samplePath, 'content.html')).toString('utf8'),
    helpers: fs.readFileSync(path.join(samplePath, 'helpers.js')).toString('utf8'),
    engine: 'handlebars',
    recipe: 'chrome-pdf',
    chrome: {
      printBackground: true
    },
    folder: {
      shortid: folder.shortid
    }
  }

  const assetObj = {
    name: 'invoice-styles.css',
    tenantId: tenant.name,
    content: fs.readFileSync(path.join(samplePath, 'asset.css')).toString('utf8'),
    folder: {
      shortid: folder.shortid
    }
  }

  await documentStore.collection('data').insert(dataObj, currentRequest)
  await documentStore.collection('assets').insert(assetObj, currentRequest)

  templateObj.data = {
    shortid: dataObj.shortid
  }

  await documentStore.collection('templates').insert(templateObj, currentRequest)
}
