const MongoClient = require('mongodb').MongoClient
const querystring = require('querystring')

const buildConnectionString = (providerConfiguration) => {
  var connectionString = 'mongodb://'

  if (providerConfiguration.username) {
    connectionString += providerConfiguration.username + ':' + providerConfiguration.password + '@'
  }

  if (!Array.isArray(providerConfiguration.address)) {
    providerConfiguration.address = [providerConfiguration.address]
    providerConfiguration.port = [providerConfiguration.port || 27017]
  }

  for (var i = 0; i < providerConfiguration.address.length; i++) {
    connectionString += providerConfiguration.address[i] + ':' + providerConfiguration.port[i] + ','
  }

  connectionString = connectionString.substring(0, connectionString.length - 1)
  connectionString += '/' + (providerConfiguration.authDb || providerConfiguration.databaseName)

  var query = {}
  if (providerConfiguration.replicaSet) {
    query.replicaSet = providerConfiguration.replicaSet
  }

  if (providerConfiguration.ssl === true) {
    query.ssl = true
  }

  if (Object.getOwnPropertyNames(query).length !== 0) {
    connectionString += '?' + querystring.stringify(query)
  }

  return connectionString
}


module.exports = function (providerConfiguration, cb) {

  const connectionString = providerConfiguration.uri || buildConnectionString(providerConfiguration)

  providerConfiguration.logger.info(`Connecting mongo to ${connectionString}`)

  // required for azure - firewall closes idle connections, wee need to set the lower value for timeouts
  var options = {
    server: {
      auto_reconnect: true,
      socketOptions: {
        keepAlive: 1,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 60000
      }
    },
    replSet: {
      auto_reconnect: true,
      socketOptions: {
        keepAlive: 1,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 60000
      }
    }
  }

  MongoClient.connect(connectionString, options, (err, db) => {
    if (err) {
      providerConfiguration.logger.error(`Connection failed ${err.stack}`)
      return cb(err)
    } else {
      providerConfiguration.logger.info('Connection successful')
    }

    cb(null, providerConfiguration.uri ? db : db.db(providerConfiguration.databaseName))
  })
}
