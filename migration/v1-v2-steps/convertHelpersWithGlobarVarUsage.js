const serializeObjectIds = require('./serializeObjectIdsForQuery')

module.exports = async (db, logger) => {
  logger.info('============================')
  logger.info('converting template helpers that contains global var usage..')

  const tenants = await db.collection('templates').distinct('tenantId')

  logger.info(`found ${tenants.length} tenants with templates`)

  let tCounter = 1

  let templatesEvaluated = 0
  let templatesMigrated = 0
  let templatesUsingUnderscore = 0
  let templatesUsingMoment = 0
  let templatesWithAssetUsage = []

  for (const tid of tenants) {
    if (tCounter++ % 200 === 0) {
      logger.info(`processing ${tCounter}/${tenants.length} tenants`)
    }

    const templates = await db.collection('templates').find({ tenantId: tid, helpersGlobalVarMigrated: { $ne: true } }).toArray()

    for (const template of templates.filter((t) => t.helpers)) {
      let newContent = template.helpers
      let shouldMigrate = false

      templatesEvaluated++

      if (
        // should be using "moment"
        /moment[.(]/.exec(template.helpers) &&
        // but should not contain any value assigned to "moment = "
        /moment[ \t]*=/.exec(template.helpers) == null
      ) {
        shouldMigrate = true
        templatesUsingMoment++
        newContent = `var moment = require('moment');\n${newContent}`
      }

      if (
        // should be using "_"
        /_\./.exec(template.helpers) &&
        // but should not contain any value assigned to "_ = "
        /_[ \t]*=/.exec(template.helpers) == null
      ) {
        shouldMigrate = true
        templatesUsingUnderscore++
        newContent = `var _ = require('underscore');\n${newContent}`
      }

      if (shouldMigrate && template.helpers.indexOf('{#asset') !== -1) {
        templatesWithAssetUsage.push(template)
        continue
      }

      if (shouldMigrate) {
        await db.collection('templates').updateOne({
          _id: template._id
        }, {
          $set: {
            helpers: newContent,
            helpersGlobalVarMigrated: true
          }
        })

        templatesMigrated++
      }
    }
  }

  if (templatesWithAssetUsage.length > 0) {
    logger.warn(`found ${
      templatesWithAssetUsage.length
    } template helpers with asset usage. these were not migrated automatically, be careful and check asset content in order to see if the code is right and update it manually if needed. ${serializeObjectIds(templatesWithAssetUsage.map(i => i._id))}`)
  }

  logger.info(`${templatesEvaluated} template(s) were evaluated in total. (${templatesUsingUnderscore} were using underscore, ${templatesUsingMoment} were using moment)`)
  logger.info(`${templatesMigrated} templates(s) were migrated correctly`)
  logger.info(`template helpers global var usage migration finished`)
}
