const sendgrid = require('sendgrid')
const helper = sendgrid.mail

module.exports = (options) => {
  const sg = sendgrid(options.sendgrid)

  return (mailOptions) => {
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
        console.error(err)
      }
    })
  }
}
