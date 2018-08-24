module.exports = (jsreport) => {
  if (!jsreport.options.skipSchedules) {
    jsreport.scheduling.start()
  }

  jsreport.scheduling.jobProcessor.executionHandler = async (schedule, task) => {
    jsreport.logger.info(`Processing scheduled report ${schedule.shortid}`)

    await jsreport.documentStore.collection('tasks').update({ _id: task._id }, {
      $set: {
        tenantId: schedule.tenantId
      }
    })

    const tenant = await jsreport.multitenancyRepository.findTenantByName(
      schedule.tenantId,
      false
    )

    delete tenant.password
    delete tenant.temporaryPassword
    // we still delete workerIp for legacy reasons,
    // just in case is still present in database record
    delete tenant.workerIp

    return jsreport.render({
      template: { shortid: schedule.templateShortid },
      context: {
        tenant: tenant,
        user: { isAdmin: true }
      },
      options: {
        scheduling: { taskId: task._id.toString(), schedule: schedule },
        reports: { save: true, mergeProperties: { taskId: task._id.toString() } }
      }
    })
  }
}
