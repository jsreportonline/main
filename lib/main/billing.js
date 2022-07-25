
module.exports = (reporter) => {
  setInterval(async () => {
    try {
      const tenants = await reporter.multitenancyRepository.find({}, { projection: { _id: 1 } })

      // eslint-disable-next-line no-unused-vars
      for (const t of tenants) {
        const tenant = (await reporter.multitenancyRepository.find({ _id: t._id }))[0]

        if (!tenant) {
          continue
        }

        const now = new Date()
        const update = checkBilling(tenant, now)

        if (update) {
          try {
            await reporter.multitenancyRepository.update({
              name: tenant.name,
              // condition bellow prevents the interval in different server
              // to register duplicated billing history
              billingCounter: tenant.billingCounter
            }, update)
          } catch (e) {
            reporter.logger.error(`Billing update failed - ${e.stack}`)
          }
        }
      }
    } catch (e) {
      reporter.logger.error(`Finding tenants for billing failed ${e.stack}`)
    }
  }, 8 * 60 * 60 * 1000)
}

module.exports.shouldBillNow = shouldBillNow
module.exports.checkBilling = checkBilling

function checkBilling (tenant, now) {
  now = now || new Date()

  if (shouldBillNow(tenant, now)) {
    const newBillingCounter = (tenant.billingCounter != null ? tenant.billingCounter : 0) + 1

    return {
      $set: {
        creditsUsed: 0,
        lastBilledDate: now,
        billingCounter: newBillingCounter
      },
      $push: {
        billingHistory: {
          billedDate: now,
          creditsUsed: tenant.creditsUsed
        }
      }
    }
  }

  return null
}

function shouldBillNow (tenant, now) {
  return !tenant.billingSkipping && isBillingDate(tenant, now)
}

function isBillingDate (tenant, now) {
  const currentDay = now.getDate()
  const billingDay = (tenant.billingDate || tenant.createdOn).getDate()
  const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

  // the billing day is already in and not billed in this month
  if (billingDay <= currentDay && (tenant.lastBilledDate.getMonth() !== now.getMonth())) {
    return true
  }

  // handle last day of the month
  return (billingDay > currentDay && currentDay === daysInCurrentMonth)
}
