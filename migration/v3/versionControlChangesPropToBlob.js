const MongoClient = require('mongodb').MongoClient
const winston = require('winston')
const { customAlphabet } = require('nanoid')
const awsSDK = require('aws-sdk')
const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 10)
const createDefaultLoggerFormat = require('../createDefaultLoggerFormat')
const defaultLoggerFormatWithTimestamp = createDefaultLoggerFormat({ timestamp: true })

const connectionString = process.env.connectionString || 'mongodb://localhost:27017'
const database = process.env.databaseName || 'multitenant'
const rootDatabase = process.env.rootDatabaseName || 'multitenant-root'

const awsAccessKeyId = process.env.awsAccessKeyId
const awsSecretAccessKey = process.env.awsSecretAccessKey
const awsS3Bucket = process.env.awsS3Bucket

if (awsAccessKeyId == null) {
  throw new Error('This script needs env var "awsAccessKeyId" to be set')
}

if (awsSecretAccessKey == null) {
  throw new Error('This script needs env var "awsSecretAccessKey" to be set')
}

if (awsS3Bucket == null) {
  throw new Error('This script needs env var "awsS3Bucket" to be set')
}

const logger = winston.createLogger({
  format: defaultLoggerFormatWithTimestamp(),
  transports: [
    new winston.transports.Console({ level: 'info', format: winston.format.combine(winston.format.colorize(), defaultLoggerFormatWithTimestamp()) }),
    new winston.transports.File({ level: 'debug', filename: 'versionControlChangesPropToBlob.log', options: { flags: 'w' } })
  ]
})

async function migrate () {
  logger.info(`connecting to ${connectionString}, root db: ${rootDatabase}, db: ${database}`)

  const s3 = new awsSDK.S3({
    accessKeyId: awsAccessKeyId,
    secretAccessKey: awsSecretAccessKey
  })

  logger.info(`using aws s3 bucket: ${awsS3Bucket}`)

  const client = await MongoClient.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true })
  const rootDb = client.db(rootDatabase)
  const db = client.db(database)

  const tenants = await rootDb.collection('tenants').find({}).project({ _id: 1, name: 1 }).toArray()

  let currentTenant
  let tCounter = 1
  let versionEntitiesMigrated = 0

  try {
    // eslint-disable-next-line no-unused-vars
    for (const t of tenants) {
      currentTenant = t.name

      if (tCounter++ % 100 === 0) {
        logger.info(`processing ${tCounter}/${tenants.length} tenants`)
      }

      const versionsToMigrate = await db.collection('versions').find({
        blobName: { $exists: false },
        tenantId: t.name
      }).project({ _id: 1, message: 1, changes: 1 }).toArray()

      if (versionsToMigrate.length > 0) {
        logger.debug(`tenant "${currentTenant}" (${versionsToMigrate.length} version entities to migrate)`)
      }

      // eslint-disable-next-line no-unused-vars
      for (const version of versionsToMigrate) {
        if (!Array.isArray(version.changes)) {
          continue
        }

        const changesForBlob = version.changes

        const blobName = `${t.name}/versions/${version.message.replace(/[^a-zA-Z0-9]/g, '')}${nanoid()}.json`
        const changesBuffer = Buffer.from(JSON.stringify(changesForBlob))

        await new Promise((resolve, reject) => {
          s3.upload({
            Bucket: awsS3Bucket,
            Key: blobName,
            Body: changesBuffer
          }, (err, data) => {
            if (err) {
              return reject(err)
            }

            resolve(blobName)
          })
        })

        await db.collection('versions').updateOne({
          _id: version._id,
          tenantId: t.name
        }, {
          $set: {
            blobName
          }
        })
      }

      versionEntitiesMigrated += versionsToMigrate.length
    }
  } catch (e) {
    e.message = `Current tenant: ${currentTenant}, Error: ${e.message}`
    throw e
  }

  if (versionEntitiesMigrated > 0) {
    logger.info(`migrated ${versionEntitiesMigrated} version entities)!`)
  } else {
    logger.info('no version entities to migrate!')
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
