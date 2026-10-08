const os = require('os')
const path = require('path')
const extend = require('node.extend.without.arrays')

module.exports = extend(true, {}, { ...process.env }, {
  debug: 'jsreport',
  stack: 'test',
  ip: getLocalIpV4Address(),
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

function getLocalIpV4Address () {
  const addresses = Object.values(os.networkInterfaces()).flatMap(addresses => addresses ?? [])

  const ip = addresses.find((address) => address.family === 'IPv4' && !address.internal)?.address

  if (ip == null) {
    throw new Error('Could not find and IP v4 address')
  }

  return ip
}
