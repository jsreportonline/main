
module.exports = (jsreport) => {
  jsreport.import.filteringListeners.add('jsreportonline', function (req, entity) {
    if (!req.tenant || !req.tenant.name) {
      throw new Error('Invalid data access')
    }

    // entity has new tenant owner
    entity.tenantId = req.tenant.name
  })

  // import processing logic for tenants
  jsreport.import.registerProcessing(function (originalProcess) {
    return function (req, col, entity) {
      return col.find({
        _id: entity._id,
        tenantId: req.tenant.name
      }).then(function (results) {
        // if the entity doesn't exists for this tenant
        // we need to generate a new _id for the entity to
        // avoid getting duplicate index error in mongodb
        if (results.length === 0) {
          entity._id = undefined

          return col.insert(entity, req).catch(function (e) {
            jsreport.logger.warn('Unable to insert an entity with new tenant owner during the import ' + e)
          })
        }

        if (originalProcess) {
          return originalProcess(req, col, entity)
        }
      })
    }
  })

  jsreport.importValidation.validationListeners.add('jsreportonline', function (req, validationInfo) {
    var entity = validationInfo.entity

    if (!req.tenant || !req.tenant.name) {
      throw new Error('Invalid data access')
    }

    if (entity.tenantId !== req.tenant.name) {
      validationInfo.importType = 'insert'
      validationInfo.log = 'Entity insert: (' + validationInfo.collectionName + ') ' + (entity.name || entity._id) + ' (importing from tenant acount: ' + entity.tenantId + ')'
    }
  })
}
