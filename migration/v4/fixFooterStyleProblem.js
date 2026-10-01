const MongoClient = require('mongodb').MongoClient
const winston = require('winston')
const createDefaultLoggerFormat = require('../createDefaultLoggerFormat')
const defaultLoggerFormatWithTimestamp = createDefaultLoggerFormat({ timestamp: true })

const connectionString = process.env.connectionString || 'mongodb://localhost:27017'
const database = process.env.databaseName || 'multitenant'
const rootDatabase = process.env.rootDatabaseName || 'multitenant-root'

const logger = winston.createLogger({
  format: defaultLoggerFormatWithTimestamp(),
  transports: [
    new winston.transports.Console({ level: 'info', format: winston.format.combine(winston.format.colorize(), defaultLoggerFormatWithTimestamp()) }),
    new winston.transports.File({ level: 'debug', filename: 'fixFooterStyleProblem.log', options: { flags: 'w' } })
  ]
})

const hasPossibleProblemRegexp =
  /(\.main\s*{[^}]*display:\s*flex;[^}]*flex-direction:\s*column;[^}]*justify-content:\s*space-between;[^}]*width:\s*100%;[^}]*height:\s*)(100%)(;[^}]*})/

async function migrate () {
  logger.info(`connecting to ${connectionString}, root db: ${rootDatabase}, db: ${database}`)

  const client = await MongoClient.connect(connectionString)
  const rootDb = client.db(rootDatabase)
  const db = client.db(database)

  const tenants = await rootDb.collection('tenants').find({}).project({ _id: 1, name: 1 }).toArray()

  let currentTenant
  let tCounter = 1
  let entitiesMigrated = 0

  try {
    // eslint-disable-next-line no-unused-vars
    for (const t of tenants) {
      currentTenant = t.name

      if (tCounter++ % 100 === 0) {
        logger.info(`processing ${tCounter}/${tenants.length} tenants`)
      }

      const entitiesToMigrate = await getTemplatesAndAssetsWithProblematicFooterStyle(db, currentTenant)

      // eslint-disable-next-line no-unused-vars
      for (const { entitySet, _id: entityId } of entitiesToMigrate) {
        const entity = await db.collection(entitySet).findOne({
          _id: entityId,
          tenantId: currentTenant
        }, {
          projection: { _id: 1, content: 1 }
        })

        // there can be multiple definitions in the content,
        // make sure to update all with the "g" flag
        const newContent = entity.content.toString().replace(
          new RegExp(hasPossibleProblemRegexp, 'g'), '$1100vh$3'
        )

        await db.collection(entitySet).updateOne({
          _id: entityId,
          tenantId: currentTenant
        }, {
          $set: {
            content: entitySet === 'templates' ? newContent : Buffer.from(newContent)
          }
        })
      }

      entitiesMigrated += entitiesToMigrate.length
    }
  } catch (e) {
    e.message = `Current tenant: ${currentTenant}, Error: ${e.message}`
    throw e
  }

  if (entitiesMigrated > 0) {
    logger.info(`migrated entities with footer style issues ${entitiesMigrated}`)
  } else {
    logger.info('no entities to migrate!')
  }

  await client.close()
}

async function getTemplatesAndAssetsWithProblematicFooterStyle (db, tenantName) {
  function hasPossibleProblem (content) {
    return content != null && hasPossibleProblemRegexp.test(content)
  }

  const problematicEntities = []

  const templateIds = await db.collection('templates').find({
    tenantId: tenantName
  }).project({ _id: 1 }).toArray()

  // eslint-disable-next-line no-unused-vars
  for (const id of templateIds) {
    const template = await db.collection('templates').findOne({
      _id: id._id,
      tenantId: tenantName
    }, {
      projection: { _id: 1, content: 1 }
    })

    if (hasPossibleProblem(template.content)) {
      problematicEntities.push({
        entitySet: 'templates',
        _id: template._id
      })
    }
  }

  const assetIds = await db.collection('assets').find({
    tenantId: tenantName
  }).project({ _id: 1 }).toArray()

  // eslint-disable-next-line no-unused-vars
  for (const id of assetIds) {
    const asset = await db.collection('assets').findOne({
      _id: id._id,
      tenantId: tenantName
    }, {
      projection: { _id: 1, content: 1, name: 1 }
    })

    if (!asset.name.endsWith('.css')) {
      continue
    }

    if (hasPossibleProblem(asset.content?.toString?.())) {
      problematicEntities.push({
        entitySet: 'assets',
        _id: asset._id
      })
    }
  }

  return problematicEntities
}

logger.info('starting query..')

migrate().then(() => {
  logger.info('============================')
  logger.info('finished!')
}).catch((err) => {
  logger.error('Error while executing query:', err)
})
