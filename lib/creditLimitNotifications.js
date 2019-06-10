const moment = require('moment')

function shouldSendNotification (lastNotification, lastBilledDate) {
  if (lastNotification == null) {
    return true
  }

  // if the limit has passed again after lastBilledDate then email
  // this ensure that tenant gets one email per billing cycle
  if (
    lastBilledDate &&
    moment(lastNotification).isBefore(lastBilledDate)
  ) {
    return true
  }

  return false
}

module.exports = (reporter) => {
  reporter.beforeRenderListeners.insert({ after: 'billing' }, 'creditLimitNotifications', async (req, res) => {
    const tenant = req.context.tenant
    const creditsUsed = Math.round(tenant.creditsUsed / 1000)
    const creditsAvailable = tenant.creditsAvailable
    const lastBilledDate = tenant.lastBilledDate
    const lastCreditLimitNotificationSentDate = tenant.lastCreditLimitNotificationSentDate

    if (creditsUsed > creditsAvailable && shouldSendNotification(lastCreditLimitNotificationSentDate, lastBilledDate)) {
      try {
        const operation = await reporter.multitenancyRepository.update({
          _id: tenant._id,
          lastCreditLimitNotificationSentDate: tenant.lastCreditLimitNotificationSentDate
        }, {
          $set: {
            lastCreditLimitNotificationSentDate: new Date()
          }
        })

        if (operation && operation.result.nModified === 1) {
          reporter.mailer({
            to: tenant.contactEmail || tenant.email,
            subject: 'jsreportonline credits limit has been exceeded',
            content: `Hi, the monthly prepaid credits in your jsreportonline account (${
              tenant.name
            }) has been exceeded. Please upgrade your jsreportonline plan to avoid service interruption. Thank you, jsreportonline team`
          })
        }
      } catch (e) {
        reporter.logger.error(`Unable to update tenant ${tenant.name} last credit limit notification ${e.stack}`)
      }
    }
  })
}
