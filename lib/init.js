const path = require('path')
const routes = require('./routes')
const pkg = require('../package.json')
const Repository = require('./multitenancyRepository')
const logger = require('./logger')

module.exports = async () => {
  const REQUEST_DISCRIMINATOR = 'context.tenant.name'
  const core = require('jsreport-core')

  const jsreport = core({
    loadConfig: true,
    migrateEntitySetsToFolders: false,
    rootDirectory: path.join(__dirname, '../')
  }).afterConfigLoaded(() => {
    logger.init(jsreport)
  })

  // skip electron init in the main
  jsreport.__electron_html_to__ = () => { }

  jsreport.use(require('jsreport-authentication')())
  jsreport.use(require('jsreport-data')())
  jsreport.use(require('jsreport-templates')())
  jsreport.use(require('jsreport-express')())
  jsreport.use(require('jsreport-chrome-pdf')())
  jsreport.use(require('jsreport-phantom-pdf')())
  jsreport.use(require('jsreport-electron-pdf')())
  jsreport.use(require('jsreport-html-to-xlsx')())
  jsreport.use(require('jsreport-pdf-utils')())
  // eslint-disable-next-line no-template-curly-in-string
  jsreport.use(require('jsreport-studio')({ title: 'jsreport ${jsreport.options.stack} ${jsreport.options.mode}' }))
  jsreport.use(require('jsreport-studio-theme-dark')())
  jsreport.use(require('jsreport-handlebars')())
  jsreport.use(require('jsreport-debug')({
    // can't pass this through config file because of debug env already set
    maxLogResponseHeaderSize: 3000
  }))
  jsreport.use(require('jsreport-scripts')())
  jsreport.use(require('jsreport-authorization')({ foldersMigrationEnabled: false }))
  jsreport.use(require('jsreport-jsrender')())
  jsreport.use(require('jsreport-child-templates')())
  jsreport.use(require('jsreport-browser-client')())
  jsreport.use(require('jsreport-public-templates')())
  jsreport.use(require('jsreport-scheduling')({ autoStart: false }))
  jsreport.use(require('jsreport-reports')())
  jsreport.use(require('jsreport-resources')())
  jsreport.use(require('jsreport-text')())
  jsreport.use(require('jsreport-xlsx')())
  jsreport.use(require('jsreport-fop-pdf')())
  jsreport.use(require('jsreport-wkhtmltopdf')())
  jsreport.use(require('jsreport-ejs')())
  jsreport.use(require('jsreport-pug')())
  jsreport.use(require('jsreport-assets')())
  jsreport.use(require('jsreport-docx')())
  jsreport.use(require('jsreport-pptx')())
  jsreport.use(require('jsreport-version-control')())
  jsreport.use(require('jsreport-import-export')())
  jsreport.use(require('jsreport-tags')())

  jsreport.use(require('jsreport-mongodb-store')())

  jsreport.use(require('jsreport-docker-workers')({ discriminatorPath: REQUEST_DISCRIMINATOR }))

  // last extension used to configure any jo custom logic
  // (it depends on others also to ensure that it runs as last)
  jsreport.use({
    main: (reporter, definition) => {
      definition.options.version = pkg.version
      definition.options.jsreportVersion = '2.6.1'
      definition.options.discriminatorPath = REQUEST_DISCRIMINATOR
      require('./jo')(reporter, definition)
    },
    directory: path.join(__dirname, '../'),
    name: 'jo',
    dependencies: [
      'jsreport-mongodb-store',
      'jsreport-import-export',
      'jsreport-scheduling',
      'jsreport-express',
      'jsreport-studio',
      'jsreport-phantom-pdf',
      'jsreport-wkhtmltopdf',
      'jsreport-docker-workers'
    ]
  })

  jsreport.multitenancyRepository = new Repository(jsreport)

  jsreport.on('before-express-configure', (app) => {
    routes(jsreport)
  })

  // adding our rewriters first (before extensions) to ensure that we have original req.context
  // as meta
  jsreport.logger.rewriters.splice(0, 0, (level, msg, meta) => {
    // detecting if meta is jsreport request object
    if (meta != null && meta.context) {
      return Object.assign({}, meta, {
        requestId: meta.context.id,
        tenant: meta.context.tenant.name
      })
    }

    return meta
  })

  jsreport.logger.rewriters.splice(1, 0, (level, msg, meta) => {
    if (meta != null) {
      return Object.assign({}, meta, {
        stack: jsreport.options.stack,
        ip: jsreport.options.ip
      })
    }

    return meta
  })

  await jsreport.init()

  console.log('dbs configured:', jsreport.options.db)

  if (process.env.createIndexes) {
    await require('./indexes').ensureIndexes(jsreport.documentStore.provider.db, jsreport.multitenancyRepository.db)
  }

  return jsreport
}
