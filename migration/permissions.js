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
    new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), defaultLoggerFormatWithTimestamp()) })
  ]
})

async function migrate () {
  logger.info(`connecting to ${connectionString}, root db: ${rootDatabase}, db: ${database}`)
  const client = await MongoClient.connect(connectionString, { useNewUrlParser: true })
  const rootDb = client.db(rootDatabase)
  const db = client.db(database)
  const tenantsIgnored = 0

  const collections = ['assets', 'data', 'schedules', 'scripts', 'tags', 'templates', 'users', 'xlsxTemplates']

  const tenants = await rootDb.collection('tenants').find({ permissionsMigrated: null }).project({ _id: 1, name: 1 }).toArray()
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

      let folders = await db.collection('folders').find({ tenantId: currentTenant }).toArray()

      // process the system folder at the end
      folders = folders.sort((a, b) => a.name === 'system')

      // eslint-disable-next-line no-unused-vars
      for (const f of folders) {
        const finalVisibilityPermissionsSet = new Set()

        // eslint-disable-next-line no-unused-vars
        for (const c of collections) {
          // eslint-disable-next-line no-unused-vars
          const entities = await db.collection(c).find({
            folder: {
              shortid: f.shortid
            },
            tenantId: currentTenant
          }).project({
            _id: 1,
            editPermissions: 1,
            readPermissions: 1,
            visibilityPermissions: 1
          }).toArray()

          entities.forEach(e => (e.editPermissions || []).forEach(p => finalVisibilityPermissionsSet.add(p)))
          entities.forEach(e => (e.readPermissions || []).forEach(p => finalVisibilityPermissionsSet.add(p)))
          entities.forEach(e => (e.visibilityPermissions || []).forEach(p => finalVisibilityPermissionsSet.add(p)))
        }

        if (f.name === 'system') {
          const usersFolder = folders.find(ff => ff.name === 'users')
          const schedulesFolder = folders.find(ff => ff.name === 'schedules')

          if (usersFolder) {
            usersFolder.visibilityPermissions.forEach(p => finalVisibilityPermissionsSet.add(p))
          }

          if (schedulesFolder) {
            schedulesFolder.visibilityPermissions.forEach(p => finalVisibilityPermissionsSet.add(p))
          }
        }

        f.visibilityPermissions = [...finalVisibilityPermissionsSet]

        await db.collection('folders').update({
          _id: f._id
        }, {
          $set: {
            visibilityPermissions: f.visibilityPermissions
          }
        })
      }

      await rootDb.collection('tenants').updateOne({
        _id: t._id
      }, { $set: { permissionsMigrated: 1 } })
    }
  } catch (e) {
    e.message = `Current tenant: ${currentTenant}, Current collection ${currentCollection}. Error: ${e.message}`
    throw e
  }

  logger.info('total tenants ignored:', tenantsIgnored)

  await client.close()
}

logger.info('starting migration..')

migrate().then(() => {
  logger.info('============================')
  logger.info('migration finished!')
}).catch((err) => {
  logger.error('Error while executing migration:')
  logger.error(err)
})
