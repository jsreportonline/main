module.exports.gumroadProductToPlan = (name) => {
  switch (name) {
    case 'jsreportonline free':
      return { plan: 'free', creditsAvailable: 200 };
    case 'jsreportonline bronze':
      return { plan: 'bronze', creditsAvailable: 10000 };
    case 'jsreportonline silver':
      return { plan: 'silver', creditsAvailable: 100000 };
    case 'jsreportonline gold':
      return { plan: 'gold', creditsAvailable: 300000 };
  }

  return null;
}
