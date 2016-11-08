let reporter

module.exports.init = (areporter) => {
  reporter = areporter

  reporter.errorNotification = (msg, err) => {
    if (reporter.options['email-errors'] === 'no') {
      return
    }

    const error = msg + ((err && err.stack) || '')

    reporter.mailer({
      to: 'support@jsreport.net',
      subject: 'joc ' + error.substring(0, 200),
      content: error
    })
  }
}

