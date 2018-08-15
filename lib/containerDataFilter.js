
const updateCustomRequireErrorMessage = require('./updateCustomRequireErrorMessage')

function filterContextTenantOrUser (context) {
  if (!context) {
    return
  }

  const newContext = Object.assign({}, context)

  if (newContext.tenant != null) {
    delete newContext.tenant
  }

  if (newContext.user != null) {
    delete newContext.user
  }

  return newContext
}

module.exports = (reporter) => {
  reporter.dockerManager.addContainerDelegateRequestFilterListener('jo', (type, originalReq, reqData, meta) => {
    const currentReqData = Object.assign({}, reqData)

    if (currentReqData.data) {
      currentReqData.data = Object.assign({}, currentReqData.data)
    }

    // sending tenant name for remote requests
    if (meta.remote === true) {
      currentReqData.tenantName = originalReq.context.tenant.name
    }

    if (type === 'scriptManager') {
      if (
        currentReqData.data &&
        currentReqData.data.req
      ) {
        const shouldRemoveTenant = (
          currentReqData.data.req.context &&
          (currentReqData.data.req.context.tenant != null || currentReqData.data.req.context.user != null)
        )

        const shouldRemoveModificationDate = (
          currentReqData.data.req.template &&
          currentReqData.data.req.template.modificationDate &&
          typeof currentReqData.data.req.template.modificationDate.toDateString === 'function'
        )

        const shouldRemove = shouldRemoveTenant || shouldRemoveModificationDate

        if (shouldRemove) {
          currentReqData.data.req = Object.assign({}, currentReqData.data.req)

          if (shouldRemoveTenant) {
            currentReqData.data.req.context = filterContextTenantOrUser(currentReqData.data.req.context)
          }

          if (shouldRemoveModificationDate) {
            currentReqData.data.req.template = Object.assign({}, currentReqData.data.req.template)
            delete currentReqData.data.req.template.modificationDate
          }
        }
      }

      if (
        currentReqData.data &&
        currentReqData.data.inputs &&
        currentReqData.data.inputs.pdfContent != null &&
        currentReqData.data.inputs.operations != null
      ) {
        currentReqData.data.inputs = Object.assign({}, currentReqData.data.inputs)

        // we add request to the payload send to container, this is needed
        // in order to process and collect logs of renders of pdf-utils.
        // the request object will be filtered in the condition bellow
        currentReqData.data.inputs.request = originalReq
      }

      if (
        currentReqData.data &&
        currentReqData.data.inputs
      ) {
        const shouldRemoveModificationDateOfTemplate = (
          currentReqData.data.inputs.template &&
          currentReqData.data.inputs.template.modificationDate &&
          typeof currentReqData.data.inputs.template.modificationDate.toDateString === 'function'
        )

        const shouldRemoveTenant = (
          currentReqData.data.inputs.request &&
          currentReqData.data.inputs.request.context &&
          (currentReqData.data.inputs.request.context.tenant != null || currentReqData.data.inputs.request.context.user != null)
        )

        const shouldRemoveModificationDate = (
          currentReqData.data.inputs.request &&
          currentReqData.data.inputs.request.template &&
          currentReqData.data.inputs.request.template.modificationDate &&
          typeof currentReqData.data.inputs.request.template.modificationDate.toDateString === 'function'
        )

        const shouldRemove = shouldRemoveModificationDateOfTemplate || shouldRemoveTenant || shouldRemoveModificationDate

        if (shouldRemove) {
          currentReqData.data.inputs = Object.assign({}, currentReqData.data.inputs)

          if (shouldRemoveModificationDateOfTemplate) {
            currentReqData.data.inputs.template = Object.assign({}, currentReqData.data.inputs.template)
            delete currentReqData.data.inputs.template.modificationDate
          }

          if (shouldRemoveTenant || shouldRemoveModificationDate) {
            currentReqData.data.inputs.request = Object.assign({}, currentReqData.data.inputs.request)
          }

          if (shouldRemoveTenant) {
            currentReqData.data.inputs.request.context = filterContextTenantOrUser(currentReqData.data.inputs.request.context)
          }

          if (shouldRemoveModificationDate) {
            currentReqData.data.inputs.request.template = Object.assign({}, currentReqData.data.inputs.request.template)
            delete currentReqData.data.inputs.request.template.modificationDate
          }
        }
      }
    } else if (type === 'recipe') {
      if (
        currentReqData.data &&
        currentReqData.data.req
      ) {
        const shouldRemoveTenant = (
          currentReqData.data.req.context &&
          (currentReqData.data.req.context.tenant != null || currentReqData.data.req.context.user != null)
        )

        const shouldRemoveModificationDate = (
          currentReqData.data.req.template &&
          currentReqData.data.req.template.modificationDate &&
          typeof currentReqData.data.req.template.modificationDate.toDateString === 'function'
        )

        const shouldRemove = shouldRemoveTenant || shouldRemoveModificationDate

        if (!shouldRemove) {
          return
        }

        currentReqData.data.req = Object.assign({}, currentReqData.data.req)

        if (shouldRemoveTenant) {
          currentReqData.data.req.context = filterContextTenantOrUser(currentReqData.data.req.context)
        }

        if (shouldRemoveModificationDate) {
          currentReqData.data.req.template = Object.assign({}, currentReqData.data.req.template)
          delete currentReqData.data.req.template.modificationDate
        }
      }
    }

    return currentReqData
  })

  reporter.dockerManager.addContainerDelegateResponseFilterListener('jo', (type, originalReq, resData, meta) => {
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
