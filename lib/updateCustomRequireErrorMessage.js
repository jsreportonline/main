
module.exports = function updateCustomRequireErrorMessage (err) {
  (['message', 'stack']).forEach((propKey) => {
    const message = 'To be able to require custom modules you need to add to configuration'

    const stringToUpdate = err[propKey]

    if (!stringToUpdate) {
      return
    }

    const customRequireMessageIndex = stringToUpdate.indexOf(message)

    if (customRequireMessageIndex !== -1) {
      const leftPart = stringToUpdate.substring(0, customRequireMessageIndex)
      const restPartIndex = stringToUpdate.indexOf('\n', customRequireMessageIndex)

      if (restPartIndex !== -1) {
        const rightPart = stringToUpdate.substring(restPartIndex)

        err[propKey] = `${leftPart}Custom require of modules are not supported in jsreportonline.${rightPart}`
      }
    }
  })
}
