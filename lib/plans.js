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
      // 50%
      return 0.5
    case 'bronze':
      // 60%
      return 0.6
    case 'silver':
      // 70%
      return 0.7
    case 'gold':
      // 100%
      return 1
  }

  return null
}
