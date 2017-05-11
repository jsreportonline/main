const Promise = require('bluebird')

const indexes = [
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

module.exports.ensureIndexes = (jsreport) => {
  console.log('Ensuring that indexes in db exists..')

  return Promise.map(indexes, (idxInfo) => {
    console.log('Ensuring indexes for ' + idxInfo.collection + ' collection..')

    return Promise.map(idxInfo.indexes, (idx) => (
      jsreport.documentStore.provider.db.collection(idxInfo.collection).ensureIndex(idx.field, idx.options)
    ))
  }).then(function () {
    console.log('Indexes exists in db')
  })
}
