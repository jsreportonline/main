const os = require('os')
const path = require('path')
const extend = require('node.extend')

module.exports = extend(true, {}, process.env, {
  debug: 'jsreport',
  stack: 'test',
  ip: '0.0.0.0',
  NODE_ENV: 'development',
  tempDirectory: path.join(os.tmpdir(), 'jsreport'),
  db: {
    rootDatabaseName: 'multitenant-root-test',
    databaseName: 'multitenant-test'
  },
  extensions: {
    mongodbStore: {
      uri: 'mongodb://localhost:27017/multitenant-test'
    },
    workerDockerManager: {
      maxContainers: 2
    }
  },
  aws: {
    accessKeyId: 'foo',
    secretAccessKey: 'foo'
  }
})
