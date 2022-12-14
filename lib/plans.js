module.exports.plans = {
  free: {
    creditsAvailable: 200
  },
  bronze: {
    creditsAvailable: 10000
  },
  silver: {
    creditsAvailable: 100000
  },
  gold: {
    creditsAvailable: 300000
  }
}

module.exports.gumroadProductToPlan = (name) => {
  switch (name) {
    case 'jsreportonline free':
      return { plan: 'free', creditsUsed: 0, creditsAvailable: this.plans.free.creditsAvailable }
    case 'jsreportonline bronze':
      return { plan: 'bronze', creditsUsed: 0, creditsAvailable: this.plans.bronze.creditsAvailable }
    case 'jsreportonline silver':
      return { plan: 'silver', creditsUsed: 0, creditsAvailable: this.plans.silver.creditsAvailable }
    case 'jsreportonline gold':
      return { plan: 'gold', creditsUsed: 0, creditsAvailable: this.plans.gold.creditsAvailable }
  }

  return null
}

module.exports.maxCreditsExcessAllowed = (plan) => {
  switch (plan) {
    case 'free':
      // 100%
      return 1
    case 'bronze':
      // 50%
      return 0.5
    case 'silver':
      // 50%
      return 0.5
    case 'gold':
      // 50%
      return 0.5
  }

  return null
}
