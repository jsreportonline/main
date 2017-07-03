const plans = require('./plans')

const validateCredits = (tenant) => {
  const creditsUsed = Math.round(tenant.creditsUsed / 1000)
  let maxCreditsExcessAllowed = plans.maxCreditsExcessAllowed(tenant.plan)

  if (maxCreditsExcessAllowed == null) {
    maxCreditsExcessAllowed = plans.maxCreditsExcessAllowed('free')
  }

  return (creditsUsed <= tenant.creditsAvailable + (tenant.creditsAvailable * maxCreditsExcessAllowed))
}

module.exports = (reporter) => {
  reporter.beforeRenderListeners.insert({ after: 'debug' }, 'credits', (req, res) => {
    let tenant = req.tenant

    if (!validateCredits(tenant)) {
      req.logger.warn('Request aborted because maximum excess of credits allowed reached')
      const err = new Error(`Maximum excess of credits allowed for your plan (${plans.maxCreditsExcessAllowed(tenant.plan != null ? tenant.plan : 'free') * 100}%+) reached, please upgrade your plan or contact support. Credits used: ${Math.round(tenant.creditsUsed / 1000)}, Credits Available: ${tenant.creditsAvailable}`)
      err.stack = null
      err.weak = true
      err.status = 429
      throw err
    }
  })
}
