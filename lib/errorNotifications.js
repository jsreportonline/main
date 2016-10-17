module.exports = (reporter) => {
  reporter.logger.rewriters.push(function (level, msg, meta) {
    const error = msg + ((meta && meta.stack) || '')
    if (level === 'error') {
      console.log(msg + meta)
      process.exit()

      if (reporter.options['email-errors'] === 'no') {
        return
      }

      reporter.mailer({
        to: 'support@jsreport.net',
        subject: 'joc ' + error.substring(0, 200),
        content: error
      })
    }
    return meta
  })
}
