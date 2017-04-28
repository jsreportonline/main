const Promise = require('bluebird')
const FS = Promise.promisifyAll(require('fs'))
const uuid = require('uuid')
const path = require('path')

module.exports.restoreFiles = (tempDirectory, scriptManagerResponse) => {
  let content
  try {
    content = JSON.parse(scriptManagerResponse.content)
  } catch (e) {
    // fallback to original syntax
    return scriptManagerResponse
  }

  return Promise.all(content.$files.map((f, i) => {
    const filePath = path.join(tempDirectory, uuid.v1() + '.xml')
    return FS.writeFileAsync(filePath, new Buffer(content.$files[i], 'base64')).then(() => (content.$files[i] = filePath))
  })).then(() => {
    scriptManagerResponse.content = JSON.stringify(content)
    return scriptManagerResponse
  })
}
