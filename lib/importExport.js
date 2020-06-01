
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
  jsreport.import.registerProcessing((originalProcess, info = {}) => {
    return async function (req, col, entity) {
      const tenant = req.context.tenant

      if (!tenant || !tenant.name) {
        throw new Error('Invalid data access')
      }

      if (info.remove === true && originalProcess) {
        return originalProcess(req, col, entity)
      }

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
          insertResult = await col.insert(entity, req)
        } catch (e) {
          const log = `Unable to insert an entity (${info.collectionName}) ${info.entityNameDisplay} with new tenant owner during the import: ${e}`

          jsreport.logger.warn(log)

          if (info.logs) {
            info.logs.push(log)
          }

          e.message = log

          throw e
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

      validationInfo.log = `Entity ${validationInfo.importType}: (${validationInfo.collectionName})${entity.tenantId == null ? '' : ` (importing from tenant acount: ${entity.tenantId})`} ${validationInfo.nameDisplay}`
    }
  })
}
