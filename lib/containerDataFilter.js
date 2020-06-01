
const updateCustomRequireErrorMessage = require('./updateCustomRequireErrorMessage')

module.exports = (reporter) => {
  reporter.dockerManager.addContainerDelegateResponseFilterListener('jo', ({ type, originalReq, resData, meta }) => {
    if (
      type === 'scriptManager' &&
      resData &&
      resData.result &&
      resData.result.error &&
      resData.result.error.message &&
      resData.result.error.stack
    ) {
      updateCustomRequireErrorMessage(resData.result.error)
    }
  })
}
