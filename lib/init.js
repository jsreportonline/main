const path = require('path')
const routes = require('./routes')
const Repository = require('./multitenancyRepository')
const logger = require('./logger')
const pkg = require('../package.json')

module.exports = async () => {
  const REQUEST_DISCRIMINATOR = 'context.tenant.name'
  const core = require('@jsreport/jsreport-core')

  const jsreport = core({
    rootDirectory: path.join(__dirname, '../'),
    loadConfig: true,
    trustUserCode: true,
    migrateEntitySetsToFolders: false,
    migrateXlsxTemplatesToAssets: false,
    migrateResourcesToAssets: false,
    migrateVersionControlProps: false,
    migrateChromeNetworkIdleProp: false,
    migrateAuthenticationUsernameProp: false
  }).afterConfigLoaded(() => {
    logger.init(jsreport)
  })

  jsreport.use(require('@jsreport/jsreport-authentication')())
  jsreport.use(require('@jsreport/jsreport-data')())
  jsreport.use(require('@jsreport/jsreport-express')())
  jsreport.use(require('@jsreport/jsreport-chrome-pdf')())
  jsreport.use(require('@jsreport/jsreport-phantom-pdf')())
  jsreport.use(require('@jsreport/jsreport-electron-pdf')())
  jsreport.use(require('@jsreport/jsreport-html-to-xlsx')())
  jsreport.use(require('@jsreport/jsreport-pdf-utils')())
  // eslint-disable-next-line no-template-curly-in-string
  jsreport.use(require('@jsreport/jsreport-studio')({ title: 'jsreport ${jsreport.options.stack} ${jsreport.options.mode}' }))
  jsreport.use(require('@jsreport/jsreport-studio-theme-dark')())
  jsreport.use(require('@jsreport/jsreport-handlebars')())
  jsreport.use(require('@jsreport/jsreport-scripts')())
  jsreport.use(require('@jsreport/jsreport-npm')())
  jsreport.use(require('@jsreport/jsreport-authorization')())
  jsreport.use(require('@jsreport/jsreport-jsrender')())
  jsreport.use(require('@jsreport/jsreport-child-templates')())
  jsreport.use(require('@jsreport/jsreport-browser-client')())
  jsreport.use(require('@jsreport/jsreport-public-templates')())
  jsreport.use(require('@jsreport/jsreport-scheduling')({ autoStart: false }))
  jsreport.use(require('@jsreport/jsreport-reports')())
  jsreport.use(require('@jsreport/jsreport-text')())
  jsreport.use(require('@jsreport/jsreport-xlsx')())
  jsreport.use(require('@jsreport/jsreport-wkhtmltopdf')())
  jsreport.use(require('@jsreport/jsreport-ejs')())
  jsreport.use(require('@jsreport/jsreport-pug')())
  jsreport.use(require('@jsreport/jsreport-assets')())
  jsreport.use(require('@jsreport/jsreport-components')())
  jsreport.use(require('@jsreport/jsreport-localization')())
  jsreport.use(require('@jsreport/jsreport-static-pdf')())
  jsreport.use(require('@jsreport/jsreport-docx')())
  jsreport.use(require('@jsreport/jsreport-pptx')())
  jsreport.use(require('@jsreport/jsreport-version-control')())
  jsreport.use(require('@jsreport/jsreport-import-export')())
  jsreport.use(require('@jsreport/jsreport-tags')())

  jsreport.use(require('@jsreport/jsreport-mongodb-store')())

  jsreport.use(require('@jsreport/jsreport-docker-workers')({ discriminatorPath: REQUEST_DISCRIMINATOR }))

  // last extension used to configure any jo custom logic
  // (it depends on others also to ensure that it runs as last)
  jsreport.use({
    name: 'jo',
    main: (reporter, definition) => {
      definition.options.version = pkg.version
      definition.options.jsreportVersion = '3.6.2'
      definition.options.discriminatorPath = REQUEST_DISCRIMINATOR
      require('./jo')(reporter, definition)
    },
    worker: 'lib/joWorker.js',
    directory: path.join(__dirname, '../'),
    dependencies: [
      'jsreport-mongodb-store',
      'jsreport-import-export',
      'jsreport-scheduling',
      'jsreport-express',
      'jsreport-studio',
      'jsreport-phantom-pdf',
      'jsreport-wkhtmltopdf',
      'jsreport-docker-workers'
    ],
    requires: {
      core: '3.x.x',
      studio: '3.x.x'
    }
  })

  jsreport.multitenancyRepository = new Repository(jsreport)

  jsreport.on('before-express-configure', (app) => {
    routes(jsreport)
  })

  await jsreport.init()

  console.log('dbs configured:', jsreport.options.db)

  if (process.env.createIndexes != null && process.env.createIndexes !== 'false') {
    await require('./indexes').ensureIndexes(jsreport.documentStore.provider.db, jsreport.multitenancyRepository.db)
  }

  return jsreport
}
