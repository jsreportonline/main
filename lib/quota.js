const quotaInterval = process.env.quotaInterval || 5 * 60 * 1000 // 5 minutes
const quota = {
  free: process.env.quotaFree || 50 * 1000,
  bronze: process.env.quotaBronze || 200 * 1000,
  silver: process.env.quotaSilver || 600 * 1000,
  gold: process.env.quotaGold || 1000 * 1000
}

const validateQuota = (tenant) => {
  console.log(quota[tenant.plan])
  return tenant.quotaUsed < (quota[tenant.plan] || tenant.quota || quota['free'])
}

module.exports = (reporter) => {
  reporter.beforeRenderListeners.insert(0, 'quota', (req, res) => {

    if (!req.tenant.quotaStart || (req.tenant.quotaStart.getTime() < (new Date().getTime() - quotaInterval))) {
      return reporter.multitenancyRepository.update({
        _id: req.tenant._id
      }, {
        $set: {
          quotaStart: new Date(),
          quotaUsed: 0
        }
      })
    }

    if (!validateQuota(req.tenant)) {
      const err = new Error(`Request quota exceeded, reset in: ${Math.ceil((req.tenant.quotaStart.getTime() + quotaInterval - new Date().getTime()) / 1000)}s`)
      err.stack = null
      err.status = 429
      throw err
    }
  })

  const updateQuota = (req) => {
    return reporter.multitenancyRepository.update({
      _id: req.tenant._id
    }, {
      $inc: {
        quotaUsed: new Date().getTime() - req.startTime
      }
    })
  }

  reporter.renderErrorListeners.add('quota', updateQuota)
  reporter.afterRenderListeners.add('quota', updateQuota)
}
