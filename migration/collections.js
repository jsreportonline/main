const path = require('path')
const Promise = require('bluebird')
const MongoDB = require('mongodb')
Promise.promisifyAll(MongoDB)

console.log('starting migration')

MongoDB.MongoClient.connectAsync(process.env['connectionString:uri']).then((db) => {
  return dropsCollections(db)
    .then(() => templateScripts(db))
    .then(() => xlsxSettings(db))
    .then(() => updateRecipes(db))
}).catch((e) => {
  console.error(e)
})

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

const dropsCollections = (db) => {
  console.log('dropping history and fs chunks')

  return db.collection('settings').dropAsync()
    .then(() => db.collection('fs.chunks').dropAsync())
    .then(() => db.collection('fs.files').dropAsync()).catch(() => {})
}

const updateRecipes = (db) => {
  return db.collection('templates').updateAsync({recipe: 'phantom-pdf'}, { $set: { "phantom.phantomjsVersion": "1.9.8-windows" } }, { multi: true})
    .then(() => db.collection('templates').updateAsync({recipe: 'wkhtmltopdf'}, { $set: { "wkhtmltopdf.wkhtmltopdfVersion": "0.12.3-windows" } }, { multi: true}))
    .then(() => db.collection('templates').updateAsync({recipe: 'wrapped-html'}, { $set: { "recipe": "html-with-browser-client" } }, { multi: true}))
}
