const { nanoid } = require('nanoid')
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
    new winston.transports.Console({ level: 'info', format: winston.format.combine(winston.format.colorize(), defaultLoggerFormatWithTimestamp()) })
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

      const xlsxTemplatesToMigrate = await db.collection('xlsxTemplates').find({
        tenantId: t.name
      }).toArray()

      if (xlsxTemplatesToMigrate.length > 0) {
        logger.debug(`tenant "${currentTenant}" (${xlsxTemplatesToMigrate.length} xlsxTemplates(s) to migrate)`)
      }

      const xlsxTemplateToAssetMap = new Map()

      // eslint-disable-next-line no-unused-vars
      for (const xlsxTemplate of xlsxTemplatesToMigrate) {
        if (!xlsxTemplateToAssetMap.has(xlsxTemplate.shortid)) {
          const assetProps = {
            content: xlsxTemplate.contentRaw,
            folder: xlsxTemplate.folder || null
          }

          if (xlsxTemplate.readPermissions != null) {
            assetProps.readPermissions = xlsxTemplate.readPermissions
          }

          if (xlsxTemplate.editPermissions != null) {
            assetProps.editPermissions = xlsxTemplate.editPermissions
          }

          const newAsset = await insertUnique(db, 'assets', `${xlsxTemplate.name}.xlsx`, assetProps, t.name)

          xlsxTemplateToAssetMap.set(xlsxTemplate.shortid, newAsset)
        }
      }

      const templateIds = await db.collection('templates').find({ tenantId: t.name }).project({ _id: 1 }).toArray()

      // eslint-disable-next-line no-unused-vars
      for (const templateId of templateIds) {
        const template = await db.collection('templates').findOne({ _id: templateId._id, tenantId: t.name })
        let continueUpdate = false

        // handle jsreport-xlsx migration
        if (template.xlsxTemplate != null) {
          continueUpdate = true

          const xlsxTemplateRef = template.xlsxTemplate

          template.xlsxTemplate = null

          if (xlsxTemplateRef.shortid != null && xlsxTemplateToAssetMap.has(xlsxTemplateRef.shortid)) {
            template.xlsx = template.xlsx || {}
            template.xlsx.templateAssetShortid = xlsxTemplateToAssetMap.get(xlsxTemplateRef.shortid).shortid
          }
        }

        // handle jsreport-html-to-xlsx migration
        if (template.baseXlsxTemplate != null) {
          continueUpdate = true

          const baseXlsxTemplateRef = template.baseXlsxTemplate

          template.baseXlsxTemplate = null

          if (baseXlsxTemplateRef.shortid != null && xlsxTemplateToAssetMap.has(baseXlsxTemplateRef.shortid)) {
            template.htmlToXlsx = template.htmlToXlsx || {}
            template.htmlToXlsx.templateAssetShortid = xlsxTemplateToAssetMap.get(baseXlsxTemplateRef.shortid).shortid
          }
        }

        if (continueUpdate) {
          await db.collection('templates').updateOne({ _id: template._id, tenantId: t.name }, { $set: template })
          templatesMigrated++
        }
      }
    }
  } catch (e) {
    e.message = `Current tenant: ${currentTenant}, Error: ${e.message}`
    throw e
  }

  if (templatesMigrated > 0) {
    logger.info(`migrated xlsxTemplates ${templatesMigrated}`)
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

const collections = ['assets', 'data', 'tags', 'users', 'schedules', 'templates', 'folders', 'scripts']
function findDuplicate (db, collectionName, name, entity, tenantName) {
  return db.collection(collectionName).findOne({
    tenantId: tenantName,
    name,
    folder: entity.folder || null
  })
}

async function insertUnique (db, collectionName, baseName, entity, tenantName) {
  let tryCount = 0

  while (true) {
    const entityName = '_'.repeat(tryCount) + baseName

    let duplicate
    // eslint-disable-next-line no-unused-vars
    for (const collection of collections) {
      const duplicate = await findDuplicate(db, collection, entityName, entity, tenantName)
      if (duplicate != null) {
        break
      }
    }

    if (duplicate != null) {
      tryCount++
      continue
    }

    const newEntity = {
      ...entity,
      tenantId: tenantName,
      creationDate: new Date(),
      modificationDate: new Date(),
      shortid: nanoid(7),
      name: entityName
    }
    await db.collection(collectionName).insertOne(newEntity)
    return newEntity
  }
}
