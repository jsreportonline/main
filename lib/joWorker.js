
module.exports = (reporter, definition) => {
  reporter.addRequestContextMetaConfig('tenant', { sandboxHidden: true })
  reporter.addRequestContextMetaConfig('user', { sandboxHidden: true })

  reporter.addRequestContextMetaConfig('startTime', { sandboxReadOnly: true })
  reporter.addRequestContextMetaConfig('throttled', { sandboxHidden: true })

  reporter.beforeRenderListeners.insert({ before: 'scripts' }, 'back-compatibility-before-script-run', (req, res) => {
    if (req.context.isChildRequest != null) {
      req.options = req.options || {}
      req.options.isChildRequest = req.context.isChildRequest
    }
  })

  reporter.beforeRenderListeners.insert({ after: 'scripts' }, 'back-compatibility-after-script-run', (req, res) => {
    if (req.template && req.template.engine === 'jade') {
      req.template.engine = 'pug'
    }

    if (Array.isArray(req.data)) {
      reporter.logger.info(`Detected deprecated usage of input data as array. template name: ${
        req.template.name
      }, shortid: ${req.template.shortid}, tenant: ${req.context.tenant.name}, requestId: ${req.context.id}`, {
        requestId: req.context.id,
        tenant: req.context.tenant.name,
        deprecation: true
      })
    }
  })
}
