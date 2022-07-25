const planLimits = {
  free: 20,
  bronze: 100,
  silver: 300,
  gold: 500
}

const folderLimit = 100

module.exports = (reporter) => {
  Object.keys(reporter.documentStore.collections).filter((key) => key !== 'reports' && key !== 'tasks' && key !== 'settings' && key !== 'profiles').forEach((key) => {
    const col = reporter.documentStore.collections[key]

    col.beforeInsertListeners.add('entityCountLimits', (doc, req) => {
      if (!req) {
        return
      }

      const tenant = req.context.tenant

      return col.count({ tenantId: tenant.name }).then((c) => {
        const limit = key === 'folders' ? folderLimit : (tenant.entityCountLimit || planLimits[tenant.plan] || planLimits.free)

        if (c > limit) {
          throw new Error(`Maximum entity count limit reached for ${col.name}. Current limit ${limit}. Please upgrade plan or decrease number of ${col.name}.`)
        }
      })
    })
  })
}
