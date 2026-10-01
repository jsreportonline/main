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
    new winston.transports.File({ level: 'debug', filename: 'deprecatedRecipesToChrome.log', options: { flags: 'w' } })
  ]
})

async function migrate () {
  logger.info(`connecting to ${connectionString}, root db: ${rootDatabase}, db: ${database}`)

  const client = await MongoClient.connect(connectionString)
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
        tenantId: currentTenant,
        recipe: {
          $in: ['phantom-pdf', 'phantom-image', 'electron-pdf', 'wkhtmltopdf']
        }
      }).project({
        _id: 1,
        name: 1,
        recipe: 1,
        phantom: 1,
        phantomImage: 1,
        electron: 1,
        wkhtmltopdf: 1
      }).toArray()

      // eslint-disable-next-line no-unused-vars
      for (const template of templatesToMigrate) {
        const $update = {
          recipe: template.recipe === 'phantom-image' ? 'chrome-image' : 'chrome-pdf'
        }

        if (template.recipe === 'phantom-image') {
          const validImageTypes = ['png', 'jpeg']

          if (
            template.phantomImage?.imageType &&
            validImageTypes.includes(template.phantomImage.imageType)
          ) {
            $update['chromeImage.type'] = template.phantomImage.imageType
          }

          if (!isNaN(parseFloat(template.phantomImage?.quality))) {
            $update['chromeImage.quality'] = parseFloat(template.phantomImage.quality)
          }

          if (template.phantomImage?.waitForJS != null) {
            $update['chromeImage.waitForJS'] = template.phantomImage.waitForJS
          }
        } else if (template.recipe === 'phantom-pdf') {
          if (template.phantom?.margin == null || typeof template.phantom?.margin === 'string') {
            // eslint-disable-next-line no-unused-vars
            for (const side of ['top', 'left', 'bottom', 'right']) {
              const targetSide = `margin${side[0].toUpperCase()}${side.slice(1)}`
              $update[`chrome.${targetSide}`] = template.phantom?.margin ?? '1cm'
            }
          } else {
            // eslint-disable-next-line no-unused-vars
            for (const side of ['top', 'left', 'bottom', 'right']) {
              const targetSide = `margin${side[0].toUpperCase()}${side.slice(1)}`
              $update[`chrome.${targetSide}`] = template.phantom?.margin[side] ?? '1cm'
            }
          }

          if (template.phantom?.header || template.phantom?.footer) {
            $update['chrome.displayHeaderFooter'] = true

            // eslint-disable-next-line no-unused-vars
            for (const section of ['header', 'footer']) {
              $update[`chrome.${section}Template`] = prepareHeaderFooter(template.phantom?.[section])

              if (template.phantom?.[section]) {
                const targetProp = section === 'header' ? 'marginTop' : 'marginBottom'
                $update[`chrome.${targetProp}`] = template.phantom[`${section}Height`] ?? '1cm'
              }
            }
          }

          $update['chrome.landscape'] = template.phantom?.orientation === 'landscape'
          $update['chrome.format'] = template.phantom?.format ?? 'A4'

          if (template.phantom?.width) {
            $update['chrome.width'] = template.phantom.width
          }

          if (template.phantom?.height) {
            $update['chrome.height'] = template.phantom.height
          }

          if (template.phantom?.waitForJS != null) {
            $update['chrome.waitForJS'] = template.phantom.waitForJS
          }
        } else if (template.recipe === 'electron-pdf') {
          if (template.electron?.marginsType != null) {
            let marginValue = '0'

            if (template.electron.marginsType === 0 || template.electron.marginsType === 2) {
              marginValue = '1cm'
            }

            // eslint-disable-next-line no-unused-vars
            for (const side of ['top', 'left', 'bottom', 'right']) {
              const targetSide = `margin${side[0].toUpperCase()}${side.slice(1)}`
              $update[`chrome.${targetSide}`] = marginValue
            }
          }

          if (template.electron?.landscape != null) {
            $update['chrome.landscape'] = template.electron?.landscape
          }

          $update['chrome.format'] = template.electron?.format ?? 'A4'

          if (template.electron?.width) {
            $update['chrome.width'] = `${template.electron.width}in`
          }

          if (template.electron?.height) {
            $update['chrome.height'] = `${template.electron.height}in`
          }

          if (template.electron?.printBackground != null) {
            $update['chrome.printBackground'] = template.electron.printBackground
          }

          if (template.electron?.waitForJS != null) {
            $update['chrome.waitForJS'] = template.electron.waitForJS
          }
        } else if (template.recipe === 'wkhtmltopdf') {
          $update['chrome.landscape'] = template.wkhtmltopdf?.orientation === 'landscape'

          // eslint-disable-next-line no-unused-vars
          for (const side of ['top', 'left', 'bottom', 'right']) {
            const targetSide = `margin${side[0].toUpperCase()}${side.slice(1)}`
            let newValue

            if (targetSide === 'left' || targetSide === 'right') {
              newValue = template.wkhtmltopdf?.[targetSide] ?? '10mm'
            } else {
              newValue = template.wkhtmltopdf?.[targetSide] ?? '0mm'
            }

            $update[`chrome.${targetSide}`] = newValue
          }

          if (template.wkhtmltopdf?.header || template.wkhtmltopdf?.footer) {
            $update['chrome.displayHeaderFooter'] = true

            // eslint-disable-next-line no-unused-vars
            for (const section of ['header', 'footer']) {
              $update[`chrome.${section}Template`] = prepareHeaderFooter(template.wkhtmltopdf[section])

              if (template.wkhtmltopdf[section]) {
                const targetProp = section === 'header' ? 'marginTop' : 'marginBottom'
                $update[`chrome.${targetProp}`] = template.wkhtmltopdf[`${section}Height`] ? `${template.wkhtmltopdf[`${section}Height`]}mm` : '1cm'
              }
            }
          }

          $update['chrome.format'] = template.wkhtmltopdf?.pageSize ?? 'A4'

          if (template.wkhtmltopdf?.pageWidth) {
            $update['chrome.width'] = template.wkhtmltopdf.pageWidth
          }

          if (template.wkhtmltopdf?.pageHeight) {
            $update['chrome.height'] = template.wkhtmltopdf.pageHeight
          }
        }

        await db.collection('templates').updateOne({
          _id: template._id,
          tenantId: currentTenant
        }, {
          $set: $update
        }, {
          // there are templates with no name, this allows to continue the migration for those
          bypassDocumentValidation: template.name == null
        })
      }

      templatesMigrated += templatesToMigrate.length
    }
  } catch (e) {
    e.message = `Current tenant: ${currentTenant}, Error: ${e.message}`
    throw e
  }

  if (templatesMigrated > 0) {
    logger.info(`migrated templates to chrome recipe ${templatesMigrated}`)
  } else {
    logger.info('no entities to migrate!')
  }

  await client.close()
}

function prepareHeaderFooter (content) {
  const styleTag = '<style>html, body { font-size: 12px; }</style>'

  if (typeof content !== 'string' || content.trim() === '') {
    return `<html>\n<head>\n${styleTag}\n</head>\n<body>\n</body>\n</html>`
  }

  const headTagRegExp = /<head(?:\s[^>]*)?>/i
  const bodyTagRegExp = /<body(?:\s[^>]*)?>/i

  // when the content already declares head or body we put the style as the
  // first child of it
  const openTagMatch = headTagRegExp.exec(content) ?? bodyTagRegExp.exec(content)

  if (openTagMatch != null) {
    const insertAt = openTagMatch.index + openTagMatch[0].length
    return `${content.slice(0, insertAt)}\n${styleTag}\n${content.slice(insertAt)}`
  }

  const htmlTagRegExp = /<html(?:\s[^>]*)?>/i
  const htmlMatch = htmlTagRegExp.exec(content)

  if (htmlMatch != null) {
    // if there is an html tag but no head or body, so we create both and the rest
    // of the content becomes the body
    const startAt = htmlMatch.index + htmlMatch[0].length
    const rest = content.slice(startAt)
    const closeMatch = /<\/html\s*>/i.exec(rest)
    const bodyContent = (closeMatch != null ? rest.slice(0, closeMatch.index) : rest).trim()
    const after = closeMatch != null ? rest.slice(closeMatch.index) : '</html>'

    return `${content.slice(0, startAt)}\n<head>\n${styleTag}\n</head>\n<body>\n${bodyContent}\n</body>\n${after}`
  }

  return `${styleTag}\n${content}`
}

logger.info('starting query..')

migrate().then(() => {
  logger.info('============================')
  logger.info('finished!')
}).catch((err) => {
  logger.error('Error while executing query:', err)
})
