module.exports = (mailer, to, token, serverUrl) => {
  mailer({
    to: to,
    subject: 'jsreportonline password reset',
    content: `Hello, please follow this link to reset your password, thank you, jsreportonline team ${serverUrl}/sign?resetToken=${token} `
  })
}