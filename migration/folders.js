const MongoClient = require('mongodb').MongoClient
const nanoid = require('nanoid')
const winston = require('winston')

const connectionString = 'mongodb://localhost:27017'
const database = 'multitenant'
const rootDatabase = 'multitenant-root'

const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({ colorize: true }),
    new (winston.transports.File)({ filename: 'foldersMigration.log', json: false, options: { flags: 'w' } })
  ]
})

async function migrate () {
  logger.info(`connecting to ${connectionString}, root db: ${rootDatabase}, db: ${database}`)
  const client = await MongoClient.connect(connectionString, { useNewUrlParser: true })
  const rootDb = client.db(rootDatabase)
  const db = client.db(database)
  let tenantsIgnored = 0

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

  const tenants = await rootDb.collection('tenants').find({ foldersMigrated: null }).project({ _id: 1, name: 1 }).toArray()
  let currentTenant
  let currentCollection

  let tCounter = 1

  try {
    for (const t of tenants) {
      currentTenant = t.name

      if (tCounter++ % 100 === 0) {
        logger.info(`processing ${tCounter}/${tenants.length} tenants`)
      }

      let allEntities = []
      let templatesCount = 0

      for (const c of collections) {
        const entities = await db.collection(c).find({
          tenantId: t.name
        }).project({ _id: 1, [collectionFieldNameMap[c]]: 1 }).toArray()

        if (c === 'templates') {
          templatesCount = entities.length
        }

        allEntities = allEntities.concat(entities.map(e => ({
          __entitySet: c,
          ...e
        })))
      }

      let unique = true

      for (const e of allEntities) {
        const duplicateFound = allEntities.find(a => {
          return (
            a._id !== e._id &&
            a[collectionFieldNameMap[a.__entitySet]] === e[collectionFieldNameMap[e.__entitySet]]
          )
        })

        if (duplicateFound) {
          unique = false
          break
        }
      }

      // if entities are unique and tenant has less than 5 templates then we don't create folders
      if (unique && templatesCount < 5) {
        tenantsIgnored++
        await rootDb.collection('tenants').updateOne({
          _id: t._id
        }, { $set: { foldersMigrated: 1 } })
        continue
      }

      for (const c of collections) {
        currentCollection = c

        // exclude entities that does not have name
        const entities = allEntities.filter(e => e.__entitySet === c && e[collectionFieldNameMap[e.__entitySet]] != null)

        if (entities.length === 0) {
          continue
        }

        const duplicatesAtCollection = {}

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

        let folder

        if (c === 'users' || c === 'schedules') {
          const systemFolder = await createFolder('system', t.name)
          folder = await createFolder(c, t.name, systemFolder.shortid)
        } else {
          folder = await createFolder(c, t.name)
        }

        const skipEntities = []

        if (Object.keys(duplicatesAtCollection).length > 0) {
          for (const [duplicateName, duplicates] of Object.entries(duplicatesAtCollection)) {
            for (const dupl of duplicates) {
              const entityFolder = await createFolder(`${duplicateName}-folder`, t.name, folder.shortid, false)

              skipEntities.push(dupl._id.toString())

              await db.collection(c).updateOne({
                _id: dupl._id
              }, {
                $set: {
                  folder: {
                    shortid: entityFolder.shortid
                  }
                }
              })
            }
          }
        }

        for (const e of entities) {
          if (skipEntities.includes(e._id.toString())) {
            continue
          }

          await db.collection(c).updateOne({
            _id: e._id
          }, {
            $set: {
              folder: {
                shortid: folder.shortid
              }
            }
          })
        }
      }

      currentCollection = null

      await rootDb.collection('tenants').updateOne({
        _id: t._id
      }, { $set: { foldersMigrated: 1 } })
    }
  } catch (e) {
    e.message = `Current tenant: ${currentTenant}, Current collection ${currentCollection}. Error: ${e.message}`
    throw e
  }

  async function createFolder (name, tenantId, parentFolderShortid, returnExisting = true, duplicateCount = 0) {
    const existsQuery = {
      name,
      tenantId
    }

    if (parentFolderShortid != null) {
      existsQuery.folder = {
        shortid: parentFolderShortid
      }
    }

    const existingFolder = await db.collection('folders').findOne(existsQuery)

    if (existingFolder) {
      if (returnExisting === false) {
        return createFolder(`${name}(${duplicateCount + 1})`, tenantId, parentFolderShortid, returnExisting, duplicateCount + 1)
      } else {
        return existingFolder
      }
    }

    const doc = {
      name,
      shortid: nanoid(8),
      tenantId
    }

    if (parentFolderShortid != null) {
      doc.folder = {
        shortid: parentFolderShortid
      }
    }

    const insertResult = await db.collection('folders').insertOne(doc)

    const folder = await db.collection('folders').findOne({
      _id: insertResult.insertedId
    })

    return folder
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
