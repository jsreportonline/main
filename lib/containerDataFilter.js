
module.exports = (reporter) => {
  reporter.dockerManager.addContainerDelegateRequestFilterListener('jo', (reqData) => {
    const type = reqData.type

    if (
      type === 'scriptManager' &&
      reqData.data &&
      reqData.data.inputs &&
      reqData.data.inputs.request &&
      reqData.data.inputs.request.context
    ) {
      const shouldRemove = reqData.data.inputs.request.context.tenant != null || reqData.data.inputs.request.context.user != null

      if (!shouldRemove) {
        return
      }

      const newReqData = Object.assign({}, reqData)
      newReqData.data = Object.assign({}, newReqData.data)
      newReqData.data.inputs = Object.assign({}, newReqData.data.inputs)
      newReqData.data.inputs.request = Object.assign({}, newReqData.data.inputs.request)
      newReqData.data.inputs.request.context = Object.assign({}, newReqData.data.inputs.request.context)

      if (newReqData.data.inputs.request.context.tenant != null) {
        delete newReqData.data.inputs.request.context.tenant
      }

      if (newReqData.data.inputs.request.context.user != null) {
        delete newReqData.data.inputs.request.context.user
      }

      return newReqData
    }

    if (
      type === 'recipe' &&
      reqData.data &&
      reqData.data.req &&
      reqData.data.req.context
    ) {
      const shouldRemove = reqData.data.req.context.tenant != null || reqData.data.req.context.user != null

      if (!shouldRemove) {
        return
      }

      const newReqData = Object.assign({}, reqData)
      newReqData.data = Object.assign({}, newReqData.data)
      newReqData.data.req = Object.assign({}, newReqData.data.req)
      newReqData.data.req.context = Object.assign({}, newReqData.data.req.context)

      if (newReqData.data.req.context.tenant != null) {
        delete newReqData.data.req.context.tenant
      }

      if (newReqData.data.req.context.user != null) {
        delete newReqData.data.req.context.user
      }

      return newReqData
    }
  })
}
