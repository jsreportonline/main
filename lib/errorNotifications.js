const moment = require('moment')
const updateCustomRequireErrorMessage = require('./updateCustomRequireErrorMessage')
let containerCrashErrors = 0
let containerNotificationControlDate = new Date()

module.exports = (reporter) => {
  reporter.errorNotification = (msg, description, err) => {
    const stack = ((err && err.stack) || '')
    const error = msg + ';' + stack + ';' + description

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

    const isContainerCrash = error.code === 'ECONNRESET' || error.message.indexOf('socket hang up') !== -1
    let shouldSendNotification = false

    if (
      // reset counter if more than one hour has passed since last control
      moment.duration(moment().diff(moment(containerNotificationControlDate))).as('hours') >= 1
    ) {
      containerCrashErrors = 0
      containerNotificationControlDate = new Date()
    }

    if (isContainerCrash) {
      containerCrashErrors++

      // we only send container crash notification in case there are 100 cases like that
      // in the last hour
      if (containerCrashErrors >= 100) {
        containerCrashErrors = 0
        containerNotificationControlDate = new Date()
        shouldSendNotification = true
      }
    } else {
      shouldSendNotification = true
    }

    if (shouldSendNotification) {
      reporter.errorNotification(`${type} error - ${data.req.context.tenant.name}`, JSON.stringify(data.body), error)
    }

    if (isContainerCrash) {
      throw new Error(`The communication with your dedicated ${type} container crashed. This is usually caused by reaching provided resources limits. The container is now about to be restarted. ${error.message}`)
    }
  })
}
