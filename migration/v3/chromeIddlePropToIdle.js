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
    new winston.transports.File({ level: 'debug', filename: 'chromeIddlePropToIdle.log', options: { flags: 'w' } })
  ]
})

async function migrate () {
  logger.info(`connecting to ${connectionString}, root db: ${rootDatabase}, db: ${database}`)

  const client = await MongoClient.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true })
  const rootDb = client.db(rootDatabase)
  const db = client.db(database)

  const tenants = await rootDb.collection('tenants').find({}).project({ _id: 1, name: 1 }).toArray()

  let currentTenant
  let tCounter = 1
  let templatesMigrated = 0

  try {
    // eslint-disable-next-line no-unused-vars
    for (const t of tenants) {
      currentTenant = t.name

      if (tCounter++ % 100 === 0) {
        logger.info(`processing ${tCounter}/${tenants.length} tenants`)
      }

      const templatesToMigrate = await db.collection('templates').find({
        tenantId: t.name,
        $or: [{
          'chrome.waitForNetworkIddle': { $exists: true },
          'chrome.waitForNetworkIdle': { $exists: false }
        }, {
          'chromeImage.waitForNetworkIddle': { $exists: true },
          'chromeImage.waitForNetworkIdle': { $exists: false }
        }]
      }).project({ _id: 1, chrome: 1, chromeImage: 1 }).toArray()

      if (templatesToMigrate.length > 0) {
        logger.debug(`tenant "${currentTenant}" (${templatesToMigrate.length} templates(s) to migrate)`)
      }

      // eslint-disable-next-line no-unused-vars
      for (const template of templatesToMigrate) {
        if (template.chrome && template.chrome.waitForNetworkIddle != null) {
          await db.collection('templates').updateOne({
            _id: template._id,
            tenantId: t.name
          }, {
            $set: {
              'chrome.waitForNetworkIdle': template.chrome.waitForNetworkIddle
            }
          })
        }

        if (template.chromeImage && template.chromeImage.waitForNetworkIddle != null) {
          await db.collection('templates').updateOne({
            _id: template._id,
            tenantId: t.name
          }, {
            $set: {
              'chromeImage.waitForNetworkIdle': template.chromeImage.waitForNetworkIddle
            }
          })
        }
      }

      templatesMigrated += templatesToMigrate.length
    }
  } catch (e) {
    e.message = `Current tenant: ${currentTenant}, Error: ${e.message}`
    throw e
  }

  if (templatesMigrated > 0) {
    logger.info(`migrated ${templatesMigrated} (chrome.waitForNetworkIddle, chromeImage.waitForNetworkIddle -> chrome.waitForNetworkIdle, chromeImage.waitForNetworkIdle) templates(s)!`)
  } else {
    logger.info('no templates to migrate!')
  }

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
