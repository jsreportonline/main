const path = require('path')
const Promise = require('bluebird')
const MongoDB = require('mongodb')
Promise.promisifyAll(MongoDB)

console.log('starting migration')

MongoDB.MongoClient.connectAsync(process.env['connectionString:uri']).then((db) => {
  return templateScripts(db).then(() => xlsxSettings(db))
}).catch((e) => {
  console.error(e)
})

const templateScripts = (db) => {
  console.log('updating scripts')

  return db.collection('templates').find({'script.shortid': {$ne:null}}).toArrayAsync().then((templates) => {
    var total = templates.length
    console.log(total)
    return Promise.map(templates.slice(0), (template) => {
      console.log(template.name)
      return db.collection('templates').update({_id: template._id}, { $set: {
        scripts: [template.script]
      }})
    }, { concurrency: 1 })
  })
}

const xlsxSettings = (db) => {
  console.log('updating settings')

  return db.db('multitenant-root').collection('tenants').find({}, {name: 1}).toArrayAsync().then((tenants) => {
    console.log(tenants.length)
    return Promise.map(tenants.slice(0), (tenant) => {
      console.log(tenant.name)
      return db.collection('settings').update({tenantId: tenant.name, key: 'xlsx-preview-informed'}, {$set: {
        tenantId: tenant.name,
        key: 'xlsx-preview-informed',
        value: 'true'
      }}, {upsert: true})
    }, { concurrency: 1 })
  })
}
