const util = require('util')
const asyncReplace = util.promisify(require('async-replace'))
const serializeObjectIds = require('./serializeObjectIdsForQuery')

module.exports = async (db, logger) => {
  logger.info('============================')
  logger.info('converting images to assets..')

  const tenants = await db.collection('images').distinct('tenantId')

  logger.info(`found ${tenants.length} tenants with images`)

  let tCounter = 1

  let imagesMigrated = 0
  let imagesEvaluated = 0
  let templatesEvaluated = 0
  let templatesUpdated = 0
  let scriptsEvaluated = 0
  let scriptsUpdated = 0
  const imagesIgnored = []

  for (const tid of tenants) {
    if (tCounter++ % 100 === 0) {
      logger.info(`processing ${tCounter}/${tenants.length} tenants`)
    }

    const images = await db.collection('images').find({ tenantId: tid, imagesToAssetsMigrated: { $ne: true } }).toArray()
    const templates = await db.collection('templates').find({ tenantId: tid }).toArray()
    const scripts = await db.collection('scripts').find({ tenantId: tid }).toArray()

    const imageToAssetMap = {}

    for (const image of images) {
      imagesEvaluated++

      if (!image.contentType || image.contentType.split('/').length < 2) {
        imagesIgnored.push(image._id.toString())
        continue
      }

      let extensionPart = image.contentType.split('/')[1].trim()

      if (extensionPart === 'svg+xml') {
        extensionPart = 'svg'
      }

      let assetName = `${image.name}.${extensionPart}`
      let asset

      do {
        asset = await db.collection('assets').findOne({ tenantId: tid, name: assetName })

        if (asset) {
          assetName = `image_${assetName}`
        }
      } while (asset)

      asset = { name: assetName, content: image.content, shortid: image.shortid, tenantId: tid }

      await db.collection('assets').insert(asset)

      await db.collection('images').updateOne({
        _id: image._id
      }, {
        $set: { imagesToAssetsMigrated: true }
      })

      imageToAssetMap[image.name] = assetName
      imagesMigrated++
    }

    for (const template of templates.filter((t) => t.content)) {
      templatesEvaluated++

      const replaceCallback = async (str, p1, offset, s, done) => {
        const imageName = (p1.indexOf(' @') !== -1) ? p1.substring(0, p1.indexOf(' @')) : p1
        const imageFound = images.find((i) => i.name === imageName)

        if (!imageFound) {
          return done(null)
        }

        const encoding = getImageEncoding(p1, imageName)

        if (!encoding) {
          return done(null)
        }

        if (!imageToAssetMap[imageName]) {
          return done(null)
        }

        done(null, `{#asset ${imageToAssetMap[imageName]} @encoding=${encoding}}`)
      }

      const newContent = await asyncReplace(template.content, /{#image (.{0,150})}/g, replaceCallback)
      let newHelpersContent

      if (template.content !== newContent) {
        await db.collection('templates').update({ _id: template._id }, { $set: { content: newContent } })
      }

      if (template.helpers != null) {
        newHelpersContent = await asyncReplace(template.helpers, /{#image (.{0,150})}/g, replaceCallback)

        if (template.helpers !== newHelpersContent) {
          await db.collection('templates').update({ _id: template._id }, { $set: { helpers: newHelpersContent } })
        }
      }

      if (
        template.content !== newContent ||
        (template.helpers != null && template.helpers !== newHelpersContent)
      ) {
        templatesUpdated++
      }
    }

    for (const script of scripts.filter((s) => s.content)) {
      scriptsEvaluated++

      const replaceCallback = async (str, p1, offset, s, done) => {
        const imageName = (p1.indexOf(' @') !== -1) ? p1.substring(0, p1.indexOf(' @')) : p1
        const imageFound = images.find((i) => i.name === imageName)

        if (!imageFound) {
          return done(null)
        }

        const encoding = getImageEncoding(p1, imageName)

        if (!encoding) {
          return done(null)
        }

        if (!imageToAssetMap[imageName]) {
          return done(null)
        }

        done(null, `{#asset ${imageToAssetMap[imageName]} @encoding=${encoding}}`)
      }

      const newContent = await asyncReplace(script.content, /{#image (.{0,150})}/g, replaceCallback)

      if (script.content !== newContent) {
        await db.collection('scripts').update({ _id: script._id }, { $set: { content: newContent } })
        scriptsUpdated++
      }
    }
  }

  logger.info(`${imagesEvaluated} image(s) were evaluated in total`)
  logger.warn(`${imagesIgnored.length} image(s) were not migrated to assets (skipped). ${serializeObjectIds(imagesIgnored)}`)
  logger.info(`${imagesMigrated} image(s) were migrated to assets correctly`)
  logger.info(`${templatesEvaluated} template(s) were evaluated in total`)
  logger.info(`${templatesUpdated} template(s) were updated from image call to asset call`)
  logger.info(`${scriptsEvaluated} scripts(s) were evaluated in total`)
  logger.info(`${scriptsUpdated} scripts(s) were updated from image call to asset call`)
  logger.info(`images to assets migration finished`)
}

function getImageEncoding (str, imageName) {
  let encoding = 'dataURI'

  if (str.indexOf(' @') !== -1) {
    const paramRaw = str.replace(imageName, '').replace(' @', '')

    if (paramRaw.split('=').length !== 2) {
      return
    }

    var paramName = paramRaw.split('=')[0]
    var paramValue = paramRaw.split('=')[1]

    if (paramName !== 'encoding') {
      return
    }

    if (paramValue !== 'base64' && paramValue !== 'dataURI') {
      return
    }

    encoding = paramValue
  }

  return encoding
}
