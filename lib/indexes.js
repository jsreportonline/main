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

const mainIndexes = [
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
    collection: 'profiles',
    indexes: [{
      field: {
        tenantId: 1
      },
      options: {
        name: 'tenant'
      }
    }, {
      field: {
        blobName: 1
      },
      options: {
        name: 'blobName'
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
  }, {
    collection: 'tags',
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
  }, {
    collection: 'folders',
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
    collection: 'usersGroups',
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
    collection: 'versions',
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
    collection: 'components',
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

  // eslint-disable-next-line no-unused-vars
  for (const idxInfo of mainIndexes) {
    console.log('Ensuring indexes for ' + idxInfo.collection + ' collection..')

    // eslint-disable-next-line no-unused-vars
    for (const idx of idxInfo.indexes) {
      await mainDb.collection(idxInfo.collection).createIndex(idx.field, idx.options)
    }
  }

  // eslint-disable-next-line no-unused-vars
  for (const idxInfo of rootIndexes) {
    console.log('Ensuring indexes for ' + idxInfo.collection + ' collection..')

    // eslint-disable-next-line no-unused-vars
    for (const idx of idxInfo.indexes) {
      await rootDb.collection(idxInfo.collection).createIndex(idx.field, idx.options)
    }
  }

  console.log('Indexes exists in db')
}
