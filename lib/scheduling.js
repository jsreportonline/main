const q = require('q')
module.exports = (jsreport) => {
  jsreport.scheduling.jobProcessor.executionHandler = (schedule, task) => {
    return q()
    jsreport.logger.info(`Processing scheduled report ${schedule.shortid}`)

    return jsreport.documentStore.collection("tasks").update({ _id: task._id }, {
      $set: {
        tenantId: schedule.tenantId
      }
    }).then(() => jsreport.render({
      template: { shortid: schedule.templateShortid },
      tenant: { name: schedule.tenantId },
      user: { isAdmin: true },
      options: {
        scheduling: { taskId: task._id.toString(), schedule: schedule },
        reports: { save: true, mergeProperties: { taskId: task._id.toString() } }
      }
    }))
  }
}
