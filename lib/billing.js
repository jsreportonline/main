
module.exports.init = (reporter) => {
  reporter.addRequestContextMetaConfig('startTime', { sandboxReadOnly: true })

  reporter.beforeRenderListeners.insert(0, 'billing', (req, res) => {
    req.context.startTime = new Date().getTime()
  })

  const updateBilling = (req, res) => {
    if (!req.context.startTime || req.context.isChildRequest) {
      // the billing is not updated when:
      // - the rendering failed so beforeRenderListeners was not able to set startTime
      // - the current request is a child request
      return
    }

    const duration = new Date().getTime() - req.context.startTime
    const creditsSpent = duration / 1000
    const isPreviewRequest = req.options.preview === true || req.options.preview === 'true'

    reporter.logger.info(`Credits spent in request: ${creditsSpent}${isPreviewRequest ? `, the credits were not discounted from your plan because this is a request made from jsreport studio` : ''}`, req)

    // add to headers the credits spent in this request
    res.meta.headers = res.meta.headers || {}
    res.meta.headers['JO-Credits-Spent'] = creditsSpent

    if (
      isPreviewRequest ||
      req.context.throttled
    ) {
      return
    }

    const tenant = req.context.tenant

    try {
      return reporter.multitenancyRepository.updateTenant(tenant.name, {
        $inc: {
          creditsUsed: duration
        }
      })
    } catch (e) {
      reporter.logger.error(`Unable to update tenant ${tenant.name} credits ${e.stack}`)
    }
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
  setInterval(async () => {
    try {
      const tenants = await reporter.multitenancyRepository.find({})

      for (const tenant of tenants) {
        const now = new Date()
        const update = checkBilling(tenant, now)

        if (update) {
          try {
            await reporter.multitenancyRepository.update({
              name: tenant.name,
              creditsBilled: tenant.creditsBilled
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
