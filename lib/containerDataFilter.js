
const updateCustomRequireErrorMessage = require('./updateCustomRequireErrorMessage')

module.exports = (reporter) => {
  reporter.dockerManager.addContainerDelegateResponseFilterListener('jo', ({ type, originalReq, resData, meta }) => {
    if (
      type === 'scriptManager' &&
      resData &&
      resData.error &&
      resData.error.message &&
      resData.error.stack
    ) {
      updateCustomRequireErrorMessage(resData.error)
    }
  })
}
