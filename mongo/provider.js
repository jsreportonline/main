var ListenerCollection = require('listener-collection')
var connection = require('./connection')
var q = require('q')
var ObjectId = require('mongodb').ObjectID

var MongoProvider = module.exports = function (model, options) {
  this._model = model
  this._options = options
  this.collections = {}
  this._options.connectionString.logger = this._options.logger
}

MongoProvider.prototype.init = function () {
  var self = this

  return q.nfcall(connection, this._options.connectionString).then(function (db) {
    self.db = db
    Object.keys(self._model.entitySets).map(function (key) {
      var entitySet = self._model.entitySets[key]
      var col = new MongoCollection(key, entitySet, self._model.entityTypes[entitySet.entityType.replace('jsreport.', '')], self._options, db)
      self.collections[key] = col
    })
  })
}

MongoProvider.prototype.collection = function (name) {
  return this.collections[name]
}

MongoProvider.prototype.adaptOData = function (odataServer) {
  var self = this
  odataServer.model(this._model)
    .onMongo(function (cb) {
      cb(null, self.db)
    }).beforeQuery(function (col, query, req, cb) {
      self.collections[col].beforeQuery(query, req).then(function () { cb() }).catch(cb)
    }).beforeUpdate(function (col, query, update, req, cb) {
      self.collections[col].beforeUpdate(query, update, req).then(function () { cb() }).catch(cb)
    }).beforeRemove(function (col, query, req, cb) {
      self.collections[col].beforeRemove(query, req).then(function () { cb() }).catch(cb)
    }).beforeInsert(function (col, doc, req, cb) {
      self.collections[col].beforeInsert(doc, req).then(function () { cb() }).catch(cb)
    })
}

function MongoCollection (name, entitySet, entityType, options, db) {
  this.name = name
  this._options = options
  this.entitySet = entitySet
  this.entityType = entityType
  this.beforeFindListeners = new ListenerCollection()
  this.beforeUpdateListeners = new ListenerCollection()
  this.beforeInsertListeners = new ListenerCollection()
  this.beforeRemoveListeners = new ListenerCollection()
  this.db = db
}

function _convertStringsToObjectIds (o) {
  for (var i in o) {
    if (i === '_id' && (typeof o[i] === 'string' || o[i] instanceof String)) {
      o[i] = new ObjectId(o[i])
    }

    if (o[i] !== null && typeof (o[i]) === 'object') {
      _convertStringsToObjectIds(o[i])
    }
  }
}

function _convertBsonToBuffer (o) {
  for (var i in o) {
    if (o[i] && o[i]._bsontype === 'Binary') {
      o[i] = o[i].buffer
      continue
    }

    if (o[i] !== null && typeof (o[i]) === 'object') {
      _convertBsonToBuffer(o[i])
    }
  }
}

MongoCollection.prototype.find = function (query, req) {
  var self = this

  _convertStringsToObjectIds(query)

  return self.beforeFindListeners.fire(query, req).then(function () {
    return q.ninvoke(self.db.collection(self.name).find(query), 'toArray').then(function (res) {
      _convertBsonToBuffer(res)
      return res
    })
  })
}

MongoCollection.prototype.count = function (query) {
  var self = this
  _convertStringsToObjectIds(query)

  return q.ninvoke(self.db.collection(self.name), 'count', query)
}

MongoCollection.prototype.insert = function (doc, req) {
  var self = this
  return self.beforeInsertListeners.fire(doc, req).then(function () {
    return q.ninvoke(self.db.collection(self.name), 'insert', doc).then(function (res) {
      if (res.ops.length !== 1) {
        throw new Error('Mongo insert should return single document')
      }

      return res.ops[0]
    })
  })
}

MongoCollection.prototype.update = function (query, update, options, req) {
  if (options && options.httpVersion) {
    req = options
    options = {}
  }

  options = options || {}
  var self = this

  _convertStringsToObjectIds(query)

  return self.beforeUpdateListeners.fire(query, update, req).then(function () {
    return q.ninvoke(self.db.collection(self.name), 'updateMany', query, update, options).then(function (res) {
      if (!res.result.ok) {
        throw new Error('Update not successful')
      }

      return res.result.n
    })
  })
}

MongoCollection.prototype.remove = function (query, req) {
  var self = this

  _convertStringsToObjectIds(query)

  return self.beforeRemoveListeners.fire(query, req).then(function () {
    return q.ninvoke(self.db.collection(self.name), 'remove', query)
  })
}

MongoCollection.prototype.beforeQuery = function (query, req) {
  this._options.logger.debug('OData query on ' + this.name)
  return this.beforeFindListeners.fire(query.$filter, req)
}

MongoCollection.prototype.beforeInsert = function (doc, req) {
  this._options.logger.debug('OData insert into ' + this.name)
  return this.beforeInsertListeners.fire(doc, req)
}

MongoCollection.prototype.beforeUpdate = function (query, update, req) {
  this._options.logger.debug('OData update on ' + this.name)
  return this.beforeUpdateListeners.fire(query, update, req)
}

MongoCollection.prototype.beforeRemove = function (query, req) {
  this._options.logger.debug('OData remove on ' + this.name)
  return this.beforeRemoveListeners.fire(query, req)
}
