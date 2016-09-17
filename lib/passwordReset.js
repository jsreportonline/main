module.exports = (mailer, to, token) => {
  mailer({
    to: to,
    subject: 'jsreportonline password reset',
    content: `Hello, please follow this link to reset your password, thank you, jsreportonline team https://jsreportonline.net/sign?resetToken=${token} `
  })
}