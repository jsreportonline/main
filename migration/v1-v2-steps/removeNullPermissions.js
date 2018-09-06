
module.exports = async (db, logger) => {
  logger.info('============================')
  logger.info('delete readPermissions and editPermissions if null')

  const tenants = await db.collection('templates').distinct('tenantId')

  logger.info(`found ${tenants.length} tenants with templates`)

  let tCounter = 1

  let templatesEvaluated = 0
  let templatesUpdated = 0

  for (const tid of tenants) {
    if (tCounter++ % 200 === 0) {
      logger.info(`processing ${tCounter}/${tenants.length} tenants`)
    }

    const templates = await db.collection('templates').find({
      tenantId: tid,
      $or: [{ readPermissions: { $in: [ null ], $exists: true } }, { editPermissions: { $in: [ null ], $exists: true } }]
    }).toArray()

    for (const template of templates) {
      templatesEvaluated++

      const $unset = {}

      if (template.readPermissions == null) {
        $unset.readPermissions = ''
      }

      if (template.editPermissions == null) {
        $unset.editPermissions = ''
      }

      await db.collection('templates').updateOne({
        _id: template._id
      }, {
        $unset
      })

      templatesUpdated++
    }
  }

  logger.info(`${templatesEvaluated} template(s) were evaluated in total`)
  logger.info(`${templatesUpdated} templates(s) were updated correctly`)
  logger.info(`delete readPermissions and editPermissions if null migration finished`)
}
