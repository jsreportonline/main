const MongoClient = require('mongodb').MongoClient
const winston = require('winston')
const createDefaultLoggerFormat = require('./createDefaultLoggerFormat')
const defaultLoggerFormatWithTimestamp = createDefaultLoggerFormat({ timestamp: true })

const connectionString = 'mongodb://localhost:27017'
const database = 'multitenant'
const rootDatabase = 'multitenant-root'

const logger = winston.createLogger({
  format: defaultLoggerFormatWithTimestamp(),
  transports: [
    new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), defaultLoggerFormatWithTimestamp()) }),
    new winston.transports.File({ filename: 'duplicateQueryResult.log', options: { flags: 'w' } })
  ]
})

async function migrate () {
  logger.info(`connecting to ${connectionString}, root db: ${rootDatabase}, db: ${database}`)
  const client = await MongoClient.connect(connectionString, { useNewUrlParser: true })
  const rootDb = client.db(rootDatabase)
  const db = client.db(database)
  const tenantsWithDuplicates = {}
  const tenantsDuplicateItems = {}

  const collections = ['assets', 'data', 'schedules', 'scripts', 'tags', 'templates', 'users', 'xlsxTemplates']

  const collectionFieldNameMap = {
    assets: 'name',
    data: 'name',
    schedules: 'name',
    scripts: 'name',
    tags: 'name',
    templates: 'name',
    users: 'username',
    xlsxTemplates: 'name'
  }

  console.log(new Date('2019-01-01T03:24:00'))

  const tenants = await rootDb.collection('tenants').find({
    lastLogin: {
      $gt: new Date('2019-01-01T03:24:00')
    }
  }).project({ _id: 1, name: 1, email: 1 }).toArray()
  let currentTenant
  let currentCollection

  let tCounter = 1

  try {
    // eslint-disable-next-line no-unused-vars
    for (const t of tenants) {
      currentTenant = t.name

      if (tCounter++ % 100 === 0) {
        logger.info(`processing ${tCounter}/${tenants.length} tenants`)
      }

      let allEntities = []

      // eslint-disable-next-line no-unused-vars
      for (const c of collections) {
        const entities = await db.collection(c).find({
          tenantId: t.name
        }).project({ _id: 1, [collectionFieldNameMap[c]]: 1 }).toArray()

        allEntities = allEntities.concat(entities.map(e => ({
          __entitySet: c,
          ...e
        })))
      }

      // eslint-disable-next-line no-unused-vars
      for (const c of collections) {
        currentCollection = c

        // exclude entities that does not have name
        const entities = allEntities.filter(e => e.__entitySet === c && e[collectionFieldNameMap[e.__entitySet]] != null)

        if (entities.length === 0) {
          continue
        }

        const duplicatesAtCollection = {}

        // eslint-disable-next-line no-unused-vars
        for (const e of entities) {
          const duplicates = entities.filter(a => {
            return (
              a._id !== e._id &&
              a[collectionFieldNameMap[a.__entitySet]] === e[collectionFieldNameMap[e.__entitySet]]
            )
          })

          if (
            duplicates.length > 0 &&
            duplicatesAtCollection[e[collectionFieldNameMap[e.__entitySet]]] == null
          ) {
            duplicatesAtCollection[e[collectionFieldNameMap[e.__entitySet]]] = [...duplicates]
            duplicatesAtCollection[e[collectionFieldNameMap[e.__entitySet]]].push(e)
          }
        }

        if (Object.keys(duplicatesAtCollection).length > 0) {
          if (tenantsWithDuplicates[t.name] == null) {
            tenantsWithDuplicates[t.name] = t
          }

          tenantsDuplicateItems[t.name] = tenantsDuplicateItems[t.name] || {}
          tenantsDuplicateItems[t.name][c] = duplicatesAtCollection
        }
      }

      currentCollection = null
    }
  } catch (e) {
    e.message = `Current tenant: ${currentTenant}, Current collection ${currentCollection}. Error: ${e.message}`
    throw e
  }

  const duplicatesDisplay = []

  Object.entries(tenantsDuplicateItems).forEach(([tenantName, collections]) => {
    const collectionsInConflict = []

    Object.entries(collections).forEach(([collectionName, duplicatedNames]) => {
      const entities = []

      Object.entries(duplicatedNames).forEach(([entityName, duplicatedEntities]) => {
        entities.push({
          name: entityName,
          duplicates: duplicatedEntities.map((e) => {
            return {
              _id: e._id
            }
          })
        })
      })

      collectionsInConflict.push({
        collection: collectionName,
        entities
      })
    })

    duplicatesDisplay.push({
      tenantName,
      contactEmail: tenantsWithDuplicates[tenantName].contactEmail != null ? tenantsWithDuplicates[tenantName].contactEmail : tenantsWithDuplicates[tenantName].email,
      collections: collectionsInConflict
    })
  })

  logger.info(JSON.stringify(duplicatesDisplay.map((t) => t.contactEmail).join(';'), null, 2))

  logger.info('tenants with duplicates count:', Object.keys(tenantsDuplicateItems).length)

  await client.close()
}

logger.info('starting query..')

migrate().then(() => {
  logger.info('============================')
  logger.info('finished!')
}).catch((err) => {
  logger.error('Error while executing query:')
  logger.error(err)
})
