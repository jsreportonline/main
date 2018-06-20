
module.exports = (jsreport) => {
  jsreport.import.filteringListeners.add('jsreportonline', (req, entity) => {
    const tenant = req.context.tenant

    if (!tenant || !tenant.name) {
      throw new Error('Invalid data access')
    }

    // entity has new tenant owner
    entity.tenantId = tenant.name
  })

  // import processing logic for tenants
  jsreport.import.registerProcessing((originalProcess) => {
    return async function (req, col, entity) {
      const tenant = req.context.tenant

      const results = await col.find({
        _id: entity._id,
        tenantId: tenant.name
      })

      // if the entity doesn't exists for this tenant
      // we need to generate a new _id for the entity to
      // avoid getting duplicate index error in mongodb
      if (results.length === 0) {
        entity._id = undefined

        let insertResult

        try {
          insertResult = col.insert(entity, req)
        } catch (e) {
          jsreport.logger.warn('Unable to insert an entity with new tenant owner during the import ' + e)
        }

        return insertResult
      }

      if (originalProcess) {
        return originalProcess(req, col, entity)
      }
    }
  })

  jsreport.importValidation.validationListeners.add('jsreportonline', (req, validationInfo) => {
    const entity = validationInfo.entity
    const tenant = req.context.tenant

    if (!tenant || !tenant.name) {
      throw new Error('Invalid data access')
    }

    if (entity.tenantId !== tenant.name) {
      validationInfo.importType = 'insert'

      validationInfo.log = `Entity insert: (${
        validationInfo.collectionName
      }) ${(entity.name || entity._id)} (importing from tenant acount: ${entity.tenantId})`
    }
  })
}
