var MongoClient = require('mongodb').MongoClient
var querystring = require('querystring')

module.exports = function (providerConfiguration, cb) {
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

  providerConfiguration.logger.info(`Connecting mongo to ${connectionString}`)

  MongoClient.connect(connectionString, (err, db) => {
    if (err) {
      providerConfiguration.logger.error(`Connection failed ${err.stack}`)
    } else {
      providerConfiguration.logger.info('Connection successful')
    }

    cb(err, db.db(providerConfiguration.databaseName))
  })
}
