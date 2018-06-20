const Promise = require('bluebird')

const rootIndexes = [
  {
    collection: 'tenants',
    indexes: [{
      field: {
        name: 1
      },
      options: {
        name: 'name'
      }
    }]
  }]

const mainIdexes = [
  {
    collection: 'assets',
    indexes: [{
      field: {
        tenantId: 1
      },
      options: {
        name: 'tenant'
      }
    }, {
      field: {
        name: 1
      },
      options: {
        name: 'name'
      }
    }]
  },
  {
    collection: 'data',
    indexes: [{
      field: {
        tenantId: 1
      },
      options: {
        name: 'tenant'
      }
    }, {
      field: {
        name: 1
      },
      options: {
        name: 'name'
      }
    }]
  },
  {
    collection: 'images',
    indexes: [{
      field: {
        tenantId: 1
      },
      options: {
        name: 'tenant'
      }
    }, {
      field: {
        name: 1
      },
      options: {
        name: 'name'
      }
    }]
  },
  {
    collection: 'reports',
    indexes: [{
      field: {
        tenantId: 1
      },
      options: {
        name: 'tenant'
      }
    }]
  },
  {
    collection: 'schedules',
    indexes: [{
      field: {
        tenantId: 1
      },
      options: {
        name: 'tenant'
      }
    }, {
      field: {
        name: 1
      },
      options: {
        name: 'name'
      }
    }]
  },
  {
    collection: 'scripts',
    indexes: [{
      field: {
        tenantId: 1
      },
      options: {
        name: 'tenant'
      }
    }, {
      field: {
        name: 1
      },
      options: {
        name: 'name'
      }
    }]
  },
  {
    collection: 'settings',
    indexes: [{
      field: {
        tenantId: 1
      },
      options: {
        name: 'tenant'
      }
    }]
  },
  {
    collection: 'tasks',
    indexes: [{
      field: {
        state: 1
      },
      options: {
        name: 'state'
      }
    }, {
      field: {
        tenantId: 1,
        scheduleShortid: 1,
        finishDate: -1
      },
      options: {
        name: 'main'
      }
    }]
  },
  {
    collection: 'templates',
    indexes: [{
      field: {
        tenantId: 1
      },
      options: {
        name: 'tenant'
      }
    }, {
      field: {
        name: 1
      },
      options: {
        name: 'name'
      }
    }]
  },
  {
    collection: 'users',
    indexes: [{
      field: {
        tenantId: 1
      },
      options: {
        name: 'tenant'
      }
    }, {
      field: {
        username: 1
      },
      options: {
        name: 'username'
      }
    }]
  },
  {
    collection: 'xlsxTemplates',
    indexes: [{
      field: {
        tenantId: 1
      },
      options: {
        name: 'tenant'
      }
    }, {
      field: {
        name: 1
      },
      options: {
        name: 'name'
      }
    }]
  }
]

module.exports.ensureIndexes = async (mainDb, rootDb) => {
  console.log('Ensuring that indexes in db exists..')

  await Promise.map(mainIdexes, (idxInfo) => {
    console.log('Ensuring indexes for ' + idxInfo.collection + ' collection..')

    return Promise.map(idxInfo.indexes, (idx) => (
      mainDb.collection(idxInfo.collection).ensureIndex(idx.field, idx.options)
    ))
  })

  await Promise.map(rootIndexes, (idxInfo) => {
    console.log('Ensuring indexes for ' + idxInfo.collection + ' collection..')

    return Promise.map(idxInfo.indexes, (idx) => (
      rootDb.collection(idxInfo.collection).ensureIndex(idx.field, idx.options)
    ))
  })

  console.log('Indexes exists in db')
}
