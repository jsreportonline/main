const mjml2html = require('mjml')
const path = require('path')
const fs = require('fs/promises')
const vm = require('vm')

module.exports = async function (type, data) {
  const content = await fs.readFile(path.join(__dirname, `${type}.mjml`))

  return interpolate(mjml2html(content.toString(), {
    filePath: __dirname
  }).html, data)
}

function interpolate (tmpl, vars) {
  const r = vm.runInNewContext('`' + tmpl + '`', vars)
  // do it twice to support nested ${}
  return vm.runInNewContext('`' + r + '`', vars)
}
