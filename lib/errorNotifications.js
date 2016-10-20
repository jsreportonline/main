module.exports = (reporter) => {
  reporter.logger.rewriters.push(function (level, msg, meta) {
    if (level !== 'error') {
      return meta
    }

    if (reporter.options['email-errors'] === 'no') {
      return meta
    }

    const error = msg + ((meta && meta.stack) || '')
    reporter.mailer({
      to: 'support@jsreport.net',
      subject: 'joc ' + error.substring(0, 200),
      content: error
    })

    return meta
  })
}
