
module.exports = async (db, logger) => {
  logger.info('============================')
  logger.info('ensure templates with html-to-xlsx recipe defaults to phantom..')

  const tenants = await db.collection('templates').distinct('tenantId')

  logger.info(`found ${tenants.length} tenants with images`)

  let tCounter = 1

  let templatesEvaluated = 0
  let templatesUpdated = 0

  for (const tid of tenants) {
    if (tCounter++ % 200 === 0) {
      logger.info(`processing ${tCounter}/${tenants.length} tenants`)
    }

    const templates = await db.collection('templates').find({
      tenantId: tid,
      recipe: 'html-to-xlsx',
      htmlToXlsxPhantomDefaultMigrated: { $ne: true }
    }).toArray()

    for (const template of templates.filter((t) => t.htmlToXlsx == null)) {
      templatesEvaluated++

      await db.collection('templates').updateOne({
        _id: template._id
      }, {
        $set: {
          htmlToXlsx: {
            htmlEngine: 'phantom'
          },
          htmlToXlsxPhantomDefaultMigrated: true
        }
      })

      templatesUpdated++
    }
  }

  logger.info(`${templatesEvaluated} template(s) were evaluated in total`)
  logger.info(`${templatesUpdated} templates(s) were updated correctly`)
  logger.info(`templates with html-to-xlsx recipe defaults to phantom migration finished`)
}
