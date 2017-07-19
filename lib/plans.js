module.exports.gumroadProductToPlan = (name) => {
  switch (name) {
    case 'jsreportonline free':
      return { plan: 'free', creditsAvailable: 200 }
    case 'jsreportonline bronze':
      return { plan: 'bronze', creditsAvailable: 10000 }
    case 'jsreportonline silver':
      return { plan: 'silver', creditsAvailable: 100000 }
    case 'jsreportonline gold':
      return { plan: 'gold', creditsAvailable: 300000 }
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
