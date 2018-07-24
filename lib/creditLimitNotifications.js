
function shouldSendNotification (today, lastNotification) {
  if (lastNotification == null) {
    return true
  }

  // only one notification per month
  return lastNotification.getMonth() !== today.getMonth()
}

module.exports = (reporter) => {
  reporter.beforeRenderListeners.insert(2, 'creditLimitNotifications', async (req, res) => {
    const tenant = req.context.tenant
    const today = new Date()
    const creditsUsed = Math.round(tenant.creditsUsed / 1000)
    const creditsAvailable = tenant.creditsAvailable
    const lastCreditLimitNotificationSentDate = tenant.lastCreditLimitNotificationSentDate

    if (creditsUsed > creditsAvailable && shouldSendNotification(today, lastCreditLimitNotificationSentDate)) {
      try {
        const operation = await reporter.multitenancyRepository.update({
          _id: tenant._id,
          lastCreditLimitNotificationSentDate: tenant.lastCreditLimitNotificationSentDate
        }, {
          $set: {
            lastCreditLimitNotificationSentDate: today
          }
        })

        if (operation && operation.result.nModified === 1) {
          reporter.mailer({
            to: tenant.contactEmail || tenant.email,
            subject: 'jsreportonline credits limit has been exceeded',
            content: `Hello, The monthly prepaid credits in your jsreportonline account (${
              tenant.name
            }) has been exceeded. Please upgrade your jsreportonline plan to avoid service interruption, more information here: https://jsreport.net/buy/online. thank you, jsreportonline team`
          })
        }
      } catch (e) {
        reporter.logger.error(`Unable to update tenant ${tenant.name} last credit limit notification ${e.stack}`)
      }
    }
  })
}
