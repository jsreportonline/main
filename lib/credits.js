const moment = require('moment')
const plans = require('./plans')

const validateCredits = (tenant) => {
  const creditsUsed = Math.round(tenant.creditsUsed / 1000)
  let maxCreditsExcessAllowed = plans.maxCreditsExcessAllowed(tenant.plan)

  if (maxCreditsExcessAllowed == null) {
    maxCreditsExcessAllowed = plans.maxCreditsExcessAllowed('free')
  }

  return (creditsUsed <= tenant.creditsAvailable + (tenant.creditsAvailable * maxCreditsExcessAllowed))
}

const shouldIgnoreLoggly = (lastMaxExcessCreditErrorDate) => {
  const today = new Date()

  const shouldIncludeInLoggly = lastMaxExcessCreditErrorDate != null
    ? (moment(today).diff(lastMaxExcessCreditErrorDate, 'minutes') >= 10)
    : true

  return shouldIncludeInLoggly !== true
}

module.exports = (reporter) => {
  reporter.beforeRenderListeners.insert({ after: 'creditLimitNotifications' }, 'credits', async (req, res) => {
    const tenant = req.context.tenant
    const today = new Date()

    if (!validateCredits(tenant)) {
      reporter.logger.warn('Request aborted because maximum excess of credits allowed reached', Object.assign({}, req, {
        logglyIgnore: shouldIgnoreLoggly(tenant.lastMaxExcessCreditErrorDate)
      }))

      await reporter.multitenancyRepository.update({
        _id: tenant._id,
        lastMaxExcessCreditErrorDate: tenant.lastMaxExcessCreditErrorDate
      }, {
        $set: {
          lastMaxExcessCreditErrorDate: today
        }
      })

      throw reporter.createError(
        `Maximum excess of credits allowed for your plan reached, please upgrade your plan or contact support. Credits used: ${
          Math.round(tenant.creditsUsed / 1000)
        }, Credits Available: ${tenant.creditsAvailable}`,
        {
          weak: true,
          maximumExcessOfCredits: true,
          statusCode: 429
        }
      )
    }
  })

  reporter.renderErrorListeners.add('credits', (req, res, err) => {
    if (err.maximumExcessOfCredits === true) {
      // to don't show big stack in loggly
      delete err.stack
    }

    if (!req.context || !req.context.tenant) {
      return
    }

    const tenant = req.context.tenant

    if (shouldIgnoreLoggly(tenant.lastMaxExcessCreditErrorDate)) {
      req.logglyIgnore = true
    }
  })
}
