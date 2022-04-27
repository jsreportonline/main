const request = require('request')

let registeredServers
let healthyServers
let lastIndex = 0

function ping () {
  let refreshedHealthyServers = []

  return Promise.all(registeredServers.map((s) => new Promise((resolve, reject) => {
    request({
      url: s,
      timeout: 5000,
      method: 'GET'
    }, (err, res, body) => {
      if (!err && body === 'OK') {
        refreshedHealthyServers.push(s)
      }
      resolve()
    })
  }))).then(() => (healthyServers = refreshedHealthyServers.sort()))
}

function findWinServer () {
  if (healthyServers.length === 0) {
    return null
  }

  // rotate servers
  lastIndex = (lastIndex + 1 >= healthyServers.length) ? 0 : lastIndex + 1

  return healthyServers[lastIndex]
}

const defaultPhantomjsChange = new Date(2016, 9, 18)

module.exports = (reporter) => {
  reporter.addRequestContextMetaConfig('windowsWorker', { sandboxHidden: true })

  reporter.afterTemplatingEnginesExecutedListeners.add('windowsWorker', (req) => {
    const isOldTenant = req.context.tenant.createdOn < defaultPhantomjsChange

    const phantomWin = (
      req.template.recipe === 'phantom-pdf' && ((
        req.template.phantom != null &&
        req.template.phantom.phantomjsVersion === '1.9.8-windows'
      ) || (
        // anonymous requests for old tenants should get the windows fallback
        isOldTenant &&
        (!req.template.phantom ||
        !req.template.phantom.phantomjsVersion)
      ))
    )

    if (
      phantomWin &&
      isOldTenant && (
        !req.template.phantom || !req.template.phantom.phantomjsVersion
      )
    ) {
      req.template.phantom = req.template.phantom || {}
      req.template.phantom.phantomjsVersion = '1.9.8-windows'
    }

    const wkhtmltopdfWin = (
      req.template.recipe === 'wkhtmltopdf' &&
      req.template.wkhtmltopdf != null &&
      req.template.wkhtmltopdf.wkhtmltopdfVersion === '0.12.3-windows'
    )

    if (phantomWin || wkhtmltopdfWin) {
      if (req.context.tenant.supportsWindows === false) {
        reporter.logger.warn('Windows recipes support stopped in jsreportonline, contact support to temporarily enable it back.', req)
        return
      }

      const winServer = findWinServer()
      const recipeVersion = wkhtmltopdfWin ? req.template.wkhtmltopdf.wkhtmltopdfVersion : req.template.phantom.phantomjsVersion

      if (!winServer) {
        reporter.logger.error('Unable to find available windows worker server')
        throw new Error('Unable to find available windows worker server')
      }

      // manually adding the tenant and requestId instead of passing req to avoid
      // storing the log in request's debug logs
      reporter.logger.info(`Request (${req.template.recipe} ${recipeVersion}) was detected to be processed in windows worker at ${winServer}`, {
        requestId: req.context.id,
        tenant: req.context.tenant.name
      })

      req.context.windowsWorker = {
        url: winServer,
        target: {
          recipe: req.template.recipe,
          version: recipeVersion
        }
      }
    }
  })

  if (process.env.windowsWorkersUrls) {
    registeredServers = process.env.windowsWorkersUrls.split(' ')
  } else {
    registeredServers = []
  }

  const intervalId = setInterval(ping, 2000)

  ping()

  return () => {
    clearInterval(intervalId)
  }
}
