const updateCustomRequireErrorMessage = require('./updateCustomRequireErrorMessage')

module.exports = (reporter) => {
  reporter.errorNotification = (msg, description, err) => {
    const stack = ((err && err.stack) || '')
    const error = msg + ';' + description + ';' + stack

    reporter.logger.error(error.substring(0, 5000))

    if (reporter.options['email-errors'] === 'no') {
      return
    }

    reporter.mailer({
      from: 'pofider@gmail.com',
      to: 'jan.blaha@hotmail.com',
      subject: `joc ${(msg + ' - ' + stack).substring(0, 200)}`,
      content: error
    })
  }

  reporter.dockerManager.addContainerDelegateErrorListener('jo', ({ type, error, data }) => {
    if (error.weak === true) {
      updateCustomRequireErrorMessage(error)
      return
    }

    reporter.errorNotification(`${type} error - ${data.req.context.tenant.name}`, JSON.stringify(data.body), error)

    if (error.code === 'ECONNRESET' || error.message.indexOf('socket hang up') !== -1) {
      throw new Error(`The communication with your dedicated ${type} container crashed. This is usually caused by reaching provided resources limits. The container is now about to be restarted. ${error.message}`)
    }
  })
}
