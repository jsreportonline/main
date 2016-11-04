const os = require('os')
const path = require('path')

module.exports = {
  debug: 'jsreport',
  NODE_ENV: 'development',
  tempDirectory: path.join(os.tmpdir(), 'jsreport'),
  connectionString: {
    rootDatabaseName: 'multitenant-root-test',
    databaseName: 'multitenant-test',
    uri: 'mongodb://localhost:27017/multitenant-test'
  },
  aws: {
    accessKeyId: 'foo',
    secretAccessKey: 'foo'
  }
}