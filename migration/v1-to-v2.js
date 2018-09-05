const MongoClient = require('mongodb').MongoClient
const winston = require('winston')
const convertImagesToAssets = require('./v1-v2-steps/convertImagesToAssets')
const detectScriptsWithBreakingChanges = require('./v1-v2-steps/detectScriptsWithBreakingChanges')
const convertHelpersWithGlobalVarUsage = require('./v1-v2-steps/convertHelpersWithGlobarVarUsage')
const ensureHtmlToXlsxDefaultToPhantom = require('./v1-v2-steps/ensureHtmlToXlsxDefaultToPhantom')
const connectionString = 'mongodb://localhost:27017'
const database = 'multitenant'

const justDetection = process.env.detectBreaking != null

const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({ colorize: true }),
    new (winston.transports.File)({ filename: 'migration.log', json: false, options: { flags: 'w' } })
  ]
})

if (justDetection) {
  logger.info('Running with just detection mode activated')
}

async function migrate () {
  logger.info(`connecting to ${connectionString}, db: ${database}`)
  const client = await MongoClient.connect(connectionString)
  const db = client.db(database)

  if (!justDetection) {
    await convertImagesToAssets(db, logger)
    await convertHelpersWithGlobalVarUsage(db, logger)
    await ensureHtmlToXlsxDefaultToPhantom(db, logger)
  }

  await detectScriptsWithBreakingChanges(db, logger, justDetection)

  await client.close()
}

logger.info('starting migration..')

migrate().then(() => {
  logger.info('============================')
  logger.info('migration finished!')
}).catch((e) => {
  logger.error('Error while executing migration:')
  logger.error(e)
})
