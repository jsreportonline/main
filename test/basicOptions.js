const os = require('os')
const path = require('path')
const extend = require('node.extend.without.arrays')
const ip = require('ip')

module.exports = extend(true, {}, { ...process.env }, {
  debug: 'jsreport',
  stack: 'test',
  ip: ip.address(),
  NODE_ENV: 'development',
  tempDirectory: path.join(os.platform() === 'darwin' ? '/tmp' : os.tmpdir(), 'jsreport'),
  db: {
    rootDatabaseName: 'multitenant-root-test',
    databaseName: 'multitenant-test'
  },
  'email-errors': 'no',
  store: {
    provider: 'mongodb'
  },
  extensions: {
    mongodbStore: {
      uri: 'mongodb://127.0.0.1:27017/multitenant-test?'
    },
    dockerWorkers: {
      numberOfWorkers: 2,
      container: {
        image: 'jsreportonline/worker:3.11.0 '
      }
    },
    authentication: {
      cookieSession: {
        secret: 'test'
      },
      admin: {
        username: 'admin',
        password: 'password'
      }
    },
    jo: {
      standardBlobStorage: true
    }
  },
  skipSchedules: true,
  aws: {
    accessKeyId: 'foo',
    secretAccessKey: 'foo'
  },
  loggly: {
    enabled: false
  }
})
