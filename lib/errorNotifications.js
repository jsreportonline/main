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

    const isContainerCrash = error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED' || error.message.indexOf('socket hang up') !== -1
    const isPayloadLimit = error.status === 413 && error.type === 'entity.too.large'
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

      // we don't want emails about body-parser limit error
      if (isPayloadLimit) {
        shouldSendNotification = false
      }
    }

    if (shouldSendNotification) {
      reporter.errorNotification(`${type} error - ${data.req.context.tenant.name}`, '', error)
    }

    if (isContainerCrash) {
      throw new Error(`The communication with your dedicated ${type} container crashed. This is usually caused by reaching provided resources limits. The container is now about to be restarted. ${error.message}`)
    }

    if (isPayloadLimit) {
      throw new Error(`The communication with your dedicated ${type} container was closed because size limit error. This is usually caused by working with big data that overpass the size limits. The container is now about to be restarted. ${error.message}`)
    }
  })
}
