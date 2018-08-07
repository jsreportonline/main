
module.exports = (reporter) => {
  reporter.dockerManager.addContainerDelegateRequestFilterListener('jo', (type, originalReq, reqData) => {
    if (
      type === 'scriptManager' &&
      reqData.data &&
      reqData.data.inputs &&
      reqData.data.inputs.pdfContent != null &&
      reqData.data.inputs.operations != null
    ) {
      // we add request to the payload send to container, this is needed
      // in order to process and collect logs of renders of pdf-utils.
      // the request object will be filtered in the condition bellow
      reqData.data.inputs.request = originalReq
    }

    if (
      type === 'scriptManager' &&
      reqData.data &&
      reqData.data.inputs
    ) {
      const shouldRemoveModificationDateOfTemplate = (
        reqData.data.inputs.template &&
        reqData.data.inputs.template.modificationDate &&
        typeof reqData.data.inputs.template.modificationDate.toDateString === 'function'
      )

      const shouldRemoveTenant = (
        reqData.data.inputs.request &&
        reqData.data.inputs.request.context &&
        (reqData.data.inputs.request.context.tenant != null || reqData.data.inputs.request.context.user != null)
      )

      const shouldRemoveModificationDate = (
        reqData.data.inputs.request &&
        reqData.data.inputs.request.template &&
        reqData.data.inputs.request.template.modificationDate &&
        typeof reqData.data.inputs.request.template.modificationDate.toDateString === 'function'
      )

      const shouldRemove = shouldRemoveModificationDateOfTemplate || shouldRemoveTenant || shouldRemoveModificationDate

      if (!shouldRemove) {
        return
      }

      const newReqData = Object.assign({}, reqData)
      newReqData.data = Object.assign({}, newReqData.data)
      newReqData.data.inputs = Object.assign({}, newReqData.data.inputs)

      if (shouldRemoveModificationDateOfTemplate) {
        newReqData.data.inputs.template = Object.assign({}, newReqData.data.inputs.template)
        delete newReqData.data.inputs.template.modificationDate
      }

      if (shouldRemoveTenant || shouldRemoveModificationDate) {
        newReqData.data.inputs.request = Object.assign({}, newReqData.data.inputs.request)
      }

      if (shouldRemoveTenant) {
        newReqData.data.inputs.request.context = Object.assign({}, newReqData.data.inputs.request.context)

        if (newReqData.data.inputs.request.context.tenant != null) {
          delete newReqData.data.inputs.request.context.tenant
        }

        if (newReqData.data.inputs.request.context.user != null) {
          delete newReqData.data.inputs.request.context.user
        }
      }

      if (shouldRemoveModificationDate) {
        newReqData.data.inputs.request.template = Object.assign({}, newReqData.data.inputs.request.template)
        delete newReqData.data.inputs.request.template.modificationDate
      }

      return newReqData
    }

    if (
      type === 'scriptManager' &&
      reqData.data &&
      reqData.data.req
    ) {
      const shouldRemoveTenant = (
        reqData.data.req.context &&
        (reqData.data.req.context.tenant != null || reqData.data.req.context.user != null)
      )

      const shouldRemoveModificationDate = (
        reqData.data.req.template &&
        reqData.data.req.template.modificationDate &&
        typeof reqData.data.req.template.modificationDate.toDateString === 'function'
      )

      const shouldRemove = shouldRemoveTenant || shouldRemoveModificationDate

      if (!shouldRemove) {
        return
      }

      const newReqData = Object.assign({}, reqData)
      newReqData.data = Object.assign({}, newReqData.data)
      newReqData.data.req = Object.assign({}, newReqData.data.req)

      if (shouldRemoveTenant) {
        newReqData.data.req.context = Object.assign({}, newReqData.data.req.context)

        if (newReqData.data.req.context.tenant != null) {
          delete newReqData.data.req.context.tenant
        }

        if (newReqData.data.req.context.user != null) {
          delete newReqData.data.req.context.user
        }
      }

      if (shouldRemoveModificationDate) {
        newReqData.data.req.template = Object.assign({}, newReqData.data.req.template)
        delete newReqData.data.req.template.modificationDate
      }

      return newReqData
    }

    if (
      type === 'recipe' &&
      reqData.data &&
      reqData.data.req
    ) {
      const shouldRemoveTenant = (
        reqData.data.req.context &&
        (reqData.data.req.context.tenant != null || reqData.data.req.context.user != null)
      )

      const shouldRemoveModificationDate = (
        reqData.data.req.template &&
        reqData.data.req.template.modificationDate &&
        typeof reqData.data.req.template.modificationDate.toDateString === 'function'
      )

      const shouldRemove = shouldRemoveTenant || shouldRemoveModificationDate

      if (!shouldRemove) {
        return
      }

      const newReqData = Object.assign({}, reqData)
      newReqData.data = Object.assign({}, newReqData.data)
      newReqData.data.req = Object.assign({}, newReqData.data.req)

      if (shouldRemoveTenant) {
        newReqData.data.req.context = Object.assign({}, newReqData.data.req.context)

        if (newReqData.data.req.context.tenant != null) {
          delete newReqData.data.req.context.tenant
        }

        if (newReqData.data.req.context.user != null) {
          delete newReqData.data.req.context.user
        }
      }

      if (shouldRemoveModificationDate) {
        newReqData.data.req.template = Object.assign({}, newReqData.data.req.template)
        delete newReqData.data.req.template.modificationDate
      }

      return newReqData
    }
  })
}
