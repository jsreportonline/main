const Promise = require('bluebird')
const MongoDB = require('mongodb')
Promise.promisifyAll(MongoDB)

console.log('starting migration ' + process.env['connectionString:uri'])

// eslint-disable-next-line no-unused-vars
const templateScripts = (db) => {
  console.log('updating scripts')

  return db.collection('templates').find({ 'script.shortid': { $ne: null } }).toArrayAsync().then((templates) => {
    var total = templates.length
    console.log(total)
    return Promise.map(templates.slice(0), (template) => {
      console.log(template.name)
      return db.collection('templates').update({ _id: template._id }, {
        $set: {
          scripts: [template.script]
        }
      })
    }, { concurrency: 1 })
  })
}

// eslint-disable-next-line no-unused-vars
const xlsxSettings = (db) => {
  console.log('updating settings')

  return db.db('multitenant-root').collection('tenants').find({}, { name: 1 }).toArrayAsync().then((tenants) => {
    console.log(tenants.length)
    return Promise.map(tenants.slice(0), (tenant) => {
      console.log(tenant.name)
      return db.collection('settings').update({ tenantId: tenant.name, key: 'xlsx-preview-informed' }, {
        $set: {
          tenantId: tenant.name,
          key: 'xlsx-preview-informed',
          value: 'true'
        }
      }, { upsert: true })
    }, { concurrency: 1 })
  })
}

// eslint-disable-next-line no-unused-vars
const dropsCollections = (db) => {
  console.log('dropping settings')

  return db.collection('settings').dropAsync()
}

// eslint-disable-next-line no-unused-vars
const updateRecipes = (db) => {
  return db.collection('templates').updateAsync({recipe: 'phantom-pdf'}, { $set: { 'phantom.phantomjsVersion': '1.9.8-windows' } }, { multi: true })
    .then(() => db.collection('templates').updateAsync({recipe: 'wkhtmltopdf'}, { $set: { 'wkhtmltopdf.wkhtmltopdfVersion': '0.12.3-windows' } }, { multi: true }))
    .then(() => db.collection('templates').updateAsync({recipe: 'wrapped-html'}, { $set: { 'recipe': 'html-with-browser-client' } }, { multi: true }))
}

const updateReportsBlobNames = (db) => {
  console.log('updating blobs')

  return db.collection('reports').find({}).toArrayAsync().then((reports) => {
    var total = reports.length
    console.log(total)
    return Promise.map(reports.slice(0), (report) => {
      console.log(--total)

      if (report.blobName.indexOf(report.tenantId) === 0) {
        return
      }

      return db.collection('reports').update({ _id: report._id }, {
        $set: {
          blobName: `${report.tenantId}/${report.blobName}`
        }
      })
    }, { concurrency: 1 })
  })
}

MongoDB.MongoClient.connectAsync(process.env['connectionString:uri']).then((db) => {
  return updateReportsBlobNames(db)

  // return dropsCollections(db)
  //   .then(() => templateScripts(db))
  //   .then(() => xlsxSettings(db))
  //   .then(() => updateRecipes(db))
  //   .then(() => updateReportsBlobNames(db))
  //   .then(() => console.log('done'))
}).catch((e) => {
  console.error(e)
})
