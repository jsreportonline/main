const sendgrid = require('sendgrid')
const helper = sendgrid.mail

module.exports = (options, logger) => {
  const sg = sendgrid(options.sendgrid)

  return (mailOptions) => {
    logger.info(`Sending email (${mailOptions.subject}) to ${mailOptions.to}`)

    const fromEmail = new helper.Email(mailOptions.from || 'support@jsreport.net')
    const toEmail = new helper.Email(mailOptions.to)
    const subject = mailOptions.subject
    const content = new helper.Content('text/plain', mailOptions.content)
    const mail = new helper.Mail(fromEmail, subject, toEmail, content)

    const request = sg.emptyRequest({
      method: 'POST',
      path: '/v3/mail/send',
      body: mail.toJSON()
    })

    sg.API(request, (err, response) => {
      if (err) {
        console.error('Error while sending mail:', err)
      }
    })
  }
}
