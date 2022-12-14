const moment = require('moment')
const plans = require('../plans')
const emails = require('./emails/emails')

module.exports = (reporter) => {
  reporter.initializeListeners.add('creditLimit', () => {
    reporter.beforeRenderListeners.insert(0, 'creditLimit', async (req, res) => {
      const tenant = req.context.tenant
      const today = new Date()

      if (shouldReject(tenant)) {
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

      if (shouldSendNotification(tenant)) {
        try {
          const operation = await reporter.multitenancyRepository.update({
            _id: tenant._id,
            lastCreditLimitNotificationSentDate: tenant.lastCreditLimitNotificationSentDate
          }, {
            $set: {
              lastCreditLimitNotificationSentDate: new Date()
            }
          })

          if (operation?.result?.nModified === 1) {
            reporter.mailer({
              to: tenant.contactEmail || tenant.email,
              subject: 'jsreportonline credits limit has been exceeded',
              html: await emails('credits', {
                tenant
              })
            })
          }
        } catch (e) {
          reporter.logger.error(`Unable to update tenant ${tenant.name} last credit limit notification ${e.stack}`)
        }
      }
    })
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

function shouldReject (tenant) {
  const creditsUsed = Math.round(tenant.creditsUsed / 1000)
  let maxCreditsExcessAllowed = plans.maxCreditsExcessAllowed(tenant.plan)

  if (maxCreditsExcessAllowed == null) {
    maxCreditsExcessAllowed = plans.maxCreditsExcessAllowed('free')
  }

  return creditsUsed > tenant.creditsAvailable + (tenant.creditsAvailable * maxCreditsExcessAllowed)
}

function shouldIgnoreLoggly (lastMaxExcessCreditErrorDate) {
  const today = new Date()

  const shouldIncludeInLoggly = lastMaxExcessCreditErrorDate != null
    ? (moment(today).diff(lastMaxExcessCreditErrorDate, 'minutes') >= 10)
    : true

  return shouldIncludeInLoggly !== true
}

function shouldSendNotification (tenant) {
  const creditsUsed = Math.round(tenant.creditsUsed / 1000)
  const creditsAvailable = tenant.creditsAvailable
  const creditLimitReached = creditsUsed > creditsAvailable

  if (creditLimitReached === false) {
    return false
  }

  const lastBilledDate = tenant.lastBilledDate
  const lastCreditLimitNotificationSentDate = tenant.lastCreditLimitNotificationSentDate

  if (lastCreditLimitNotificationSentDate == null) {
    return true
  }

  // if the limit has passed again after lastBilledDate then email
  // this ensure that tenant gets one email per billing cycle
  if (
    lastBilledDate &&
    moment(lastCreditLimitNotificationSentDate).isBefore(lastBilledDate)
  ) {
    return true
  }

  return false
}
