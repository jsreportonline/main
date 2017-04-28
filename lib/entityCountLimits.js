const planLimits = {
  free: 20,
  bronze: 100,
  silver: 300,
  gold: 500
}

module.exports = (reporter) => {
  Object.keys(reporter.documentStore.collections).filter((key) => key !== 'reports' && key !== 'tasks' && key !== 'settings').forEach((key) => {
    const col = reporter.documentStore.collections[key]
    col.beforeInsertListeners.add('entityCountLimits', (doc, req) => {
      if (!req) {
        return
      }

      return col.count({tenantId: req.tenant.name}).then((c) => {
        const limit = req.tenant.entityCountLimit || planLimits[req.tenant.plan] || planLimits['free']

        if (c > limit) {
          throw new Error(`Maximum entity count limit reached for ${col.name}. Current limit ${limit}. Please upgrade plan or decrease number of ${col.name}.`)
        }
      })
    })
  })
}
