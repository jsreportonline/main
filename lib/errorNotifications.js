let reporter

module.exports.init = (areporter) => {
  reporter = areporter

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
      subject: 'joc ' + (msg + ' - ' + stack).substring(0, 200),
      content: error
    })
  }
}

