
module.exports = (jsreport) => {
  jsreport.importValidation.beforeEntityValidationListeners.add('jsreportonline', (req, validationInfo) => {
    const entity = validationInfo.entity
    const tenant = req.context.tenant

    if (!tenant || !tenant.name) {
      throw new Error('Invalid data access')
    }

    if (entity.tenantId !== tenant.name) {
      validationInfo.log = `Entity ${validationInfo.importType}: (${
        validationInfo.collectionName
      }) ${validationInfo.nameDisplay}${entity.tenantId == null ? '' : ` (importing from tenant acount: ${entity.tenantId})`}`
    }
  })

  jsreport.import.beforeEntityPersistedListeners.add('jsreportonline', (req, entity) => {
    const tenant = req.context.tenant

    if (!tenant || !tenant.name) {
      throw new Error('Invalid data access')
    }

    // entity has new tenant owner
    entity.tenantId = tenant.name
  })
}
