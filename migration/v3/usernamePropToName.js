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
    new winston.transports.File({ level: 'debug', filename: 'usernamePropToName.log', options: { flags: 'w' } })
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
  let usersMigrated = 0

  try {
    // eslint-disable-next-line no-unused-vars
    for (const t of tenants) {
      currentTenant = t.name

      if (tCounter++ % 100 === 0) {
        logger.info(`processing ${tCounter}/${tenants.length} tenants`)
      }

      const usersToMigrate = await db.collection('users').find({
        name: null,
        tenantId: t.name
      }).project({ _id: 1, username: 1 }).toArray()

      if (usersToMigrate.length > 0) {
        logger.debug(`tenant "${currentTenant}" (${usersToMigrate.length} user(s) to migrate)`)
      }

      // eslint-disable-next-line no-unused-vars
      for (const user of usersToMigrate) {
        await db.collection('users').updateOne({
          _id: user._id,
          tenantId: t.name
        }, {
          $set: {
            name: user.username
          }
        })
      }

      usersMigrated += usersToMigrate.length
    }
  } catch (e) {
    e.message = `Current tenant: ${currentTenant}, Error: ${e.message}`
    throw e
  }

  if (usersMigrated > 0) {
    logger.info(`migrated ${usersMigrated} users(s)!`)
  } else {
    logger.info('no users to migrate!')
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
