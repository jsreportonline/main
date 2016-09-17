const sendgrid = require('sendgrid')
const logger = require('./logger')
const helper = sendgrid.mail

module.exports = (options) => {
  const sg = sendgrid(options.sendgrid)

  return (mailOptions) => {

    const from_email = new helper.Email('support@jsreport.net')
    const to_email = new helper.Email(mailOptions.to)
    const subject = mailOptions.subject
    const content = new helper.Content('text/plain', mailOptions.content);
    const mail = new helper.Mail(from_email, subject, to_email, content);

    const request = sg.emptyRequest({
      method: 'POST',
      path: '/v3/mail/send',
      body: mail.toJSON()
    })

    sg.API(request, (err, response) => {
      if (err) {
        logger.error('foo')
      }
    })
  }
}
