module.exports.init = (reporter) => {
  reporter.beforeRenderListeners.add('billing', (req, res) => {
    req.startTime = new Date().getTime()
  })

  const updateBilling = (req, res) => {
    var duration = new Date().getTime() - req.startTime

    if (req.options.preview) {
      return
    }

    return reporter.multitenancyRepository.updateTenant(req.tenant.name, {
      $inc: {
        creditsUsed: duration
      }
    }).catch((e) => {
      reporter.logger.error(`Unable to update tenant ${req.tenant.name} credits ${e.stack}`)
    })
  }

  reporter.afterRenderListeners.add('billing', updateBilling)
  reporter.renderErrorListeners.add('billing', updateBilling)

  startBilling(reporter)
}

const isBillingDate = (tenant, now) => {
  var currentDay = now.getDate()
  var billingDay = tenant.createdOn.getDate()
  var daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

  // the billing day is already in and not billed in this month
  if (billingDay <= currentDay && (tenant.lastBilledDate.getMonth() !== now.getMonth())) {
    return true
  }

  // handle last day of the month
  return (billingDay > currentDay && currentDay === daysInCurrentMonth)
}

const shouldBillNow = module.exports.shouldBillNow = (tenant, now) => {
  return !tenant.billingSkipping && isBillingDate(tenant, now)
}

const checkBilling = module.exports.checkBilling = (tenant, now) => {
  now = now || new Date()

  if (shouldBillNow(tenant, now)) {
    return {
      $set: {
        creditsUsed: 0,
        lastBilledDate: now
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

const startBilling = (reporter) => {
  setInterval(function () {
    reporter.multitenancyRepository.find({}).then((tenants) => {
      tenants.forEach((tenant) => {
        const now = new Date()
        const update = checkBilling(tenant, now)
        if (update) {
          reporter.multitenancyRepository.update({
            name: tenant.name,
            creditsBilled: tenant.creditsBilled
          }, update).catch((e) => {
            reporter.logger.error(`Billing update failed - ${e.stack}`)
          })
        }
      })
    }).catch(function (e) {
      reporter.logger.error(`Finding  tenants for billing failed ${e.stack}`)
    })
  }, 8 * 60 * 60 * 1000)
}
