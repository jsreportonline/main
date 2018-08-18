const util = require('util')
const asyncReplace = util.promisify(require('async-replace'))
const serializeObjectIds = require('./serializeObjectIdsForQuery')

module.exports = async (db, logger, justDetection) => {
  logger.info('============================')
  logger.info('detecting scripts with breaking changes..')

  const tenants = await db.collection('scripts').distinct('tenantId')

  logger.info(`found ${tenants.length} tenants with scripts`)

  let tCounter = 1

  let scriptsEvaluated = 0
  let scriptsWithNoHookDetected = []
  let scriptsWithHookWithOneArgument = []

  let scriptsWithOneArgRequestUsage = []
  let scriptsWithOneArgResponseUsage = []
  let scriptsWithThreeArgsRequestUsage = []
  let scriptsWithThreeArgsResponseUsage = []

  for (const tid of tenants) {
    if (tCounter++ % 100 === 0) {
      logger.info(`processing ${tCounter}/${tenants.length} tenants`)
    }

    const scripts = await db.collection('scripts').find({ tenantId: tid, migrated: { $ne: true } }).toArray()

    for (const script of scripts.filter((s) => s.content)) {
      scriptsEvaluated++

      const scriptHookFunctionRegExp = /function[ \t]+((?:beforeRender|afterRender)\s*(\((?:[^()])*\)))/g
      const scriptReplaceHookArgsRegExp = /function[ \t]+((beforeRender|afterRender)\s*(\((?:[^()])*\)))/g

      let scriptHookMatch = scriptHookFunctionRegExp.exec(script.content)

      if (scriptHookMatch == null) {
        // filter for scripts that don't have hooks but contain wrong content (html, helpers, etc)
        if (/done\(/.exec(script.content) != null) {
          scriptsWithNoHookDetected.push(script._id.toString())
        }
      } else {
        let needsMigrationFromOneArgument = false

        while (scriptHookMatch != null) {
          if (scriptHookMatch[2] != null) {
            // remove the first and last character "(", ")"
            const argsStringPart = scriptHookMatch[2].substr(1).slice(0, -1).trim()

            if (argsStringPart !== '') {
              const args = argsStringPart.split(',').map((s) => s.trim())

              if (args.length === 1) {
                if (/request[ \t]*=[ \t]*[^=]{1}/.exec(script.content) != null) {
                  if (scriptsWithOneArgRequestUsage.indexOf(script._id.toString()) === -1) {
                    scriptsWithOneArgRequestUsage.push(script._id.toString())
                  }
                }

                if (/response[ \t]*=[ \t]*[^=]{1}/.exec(script.content) != null) {
                  if (scriptsWithOneArgResponseUsage.indexOf(script._id.toString()) === -1) {
                    scriptsWithOneArgResponseUsage.push(script._id.toString())
                  }
                }
              }

              if (
                args.length === 3 &&
                (args[0] !== 'request' || args[1] !== 'response') &&
                // if it is not requiring "request"
                /require\(\s*['"]request['"]\s*\)/.exec(script.content) == null
              ) {
                if (/request\.[^\t]*?/.exec(script.content) != null) {
                  if (scriptsWithThreeArgsRequestUsage.indexOf(script._id.toString()) === -1) {
                    scriptsWithThreeArgsRequestUsage.push(script._id.toString())
                  }
                }

                if (/response\.[^\t]*?/.exec(script.content) != null) {
                  if (scriptsWithThreeArgsResponseUsage.indexOf(script._id.toString()) === -1) {
                    scriptsWithThreeArgsResponseUsage.push(script._id.toString())
                  }
                }
              }

              if (args.length === 1) {
                needsMigrationFromOneArgument = true
                scriptsWithHookWithOneArgument.push(script._id.toString())
                break
              }
            }
          }

          scriptHookMatch = scriptHookFunctionRegExp.exec(script.content)
        }

        if (needsMigrationFromOneArgument) {
          const newContent = await asyncReplace(script.content, scriptReplaceHookArgsRegExp, async (str, p1, p2, p3, offset, s, done) => {
            const hookName = p2
            let hookArgs = p3.substr(1).slice(0, -1).trim()

            if (hookArgs === '') {
              return done(null, str)
            }

            hookArgs = hookArgs.split(',')

            if (hookArgs.length > 1) {
              return done(null, str)
            }

            const doneCallbackArgName = hookArgs[0]

            // important to name the parameters "request", "response", because there are some
            // scripts that use the deprecated global "request", "response" variables inside hooks.
            // the only problem is that this is problematic is there is some script that have some code like this
            // "var request = require('request')", our handling will make scripts like that to fail because the
            // request variable inside the hook will be the renderRequest
            // (STATUS: INVESTIGATING)
            done(null, `function ${hookName} (request, response, ${doneCallbackArgName})`)
          })

          if (script.content !== newContent && !justDetection) {
            await db.collection('scripts').update({ _id: script._id }, { $set: { content: newContent, migrated: true } })
          }
        }
      }
    }
  }

  logger.info(`${scriptsEvaluated} scripts(s) were evaluated in total`)
  logger.warn(`${scriptsWithNoHookDetected.length} scripts(s) were detected with no beforeRender/afterRender function hook, ${serializeObjectIds(scriptsWithNoHookDetected)}`)
  logger.info(`${scriptsWithHookWithOneArgument.length} scripts(s) were detected with just one argument in function hook and were updated to function with three arguments, ${serializeObjectIds(scriptsWithHookWithOneArgument)}`)

  if (!justDetection) {
    logger.warn(`${scriptsWithOneArgRequestUsage.length} scripts(s) were using one argument (now these are migrated to three args) in hooks and was detected "request" usage (manual check is needed and manual update if necessary), ${serializeObjectIds(scriptsWithOneArgRequestUsage)}`)
    logger.warn(`${scriptsWithOneArgResponseUsage.length} scripts(s) were using one argument (now these are migrated to three args) in hooks and was detected "response" usage (manual check is needed and manual update if necessary), ${serializeObjectIds(scriptsWithOneArgResponseUsage)}`)
  } else {
    logger.warn(`${scriptsWithOneArgRequestUsage.length} scripts(s) were detected using one argument in hooks and was detected "request" usage (manual check is needed and manual update if necessary), ${serializeObjectIds(scriptsWithOneArgRequestUsage)}`)
    logger.warn(`${scriptsWithOneArgResponseUsage.length} scripts(s) were detected using one argument in hooks and was detected "response" usage (manual check is needed and manual update if necessary), ${serializeObjectIds(scriptsWithOneArgResponseUsage)}`)
  }

  logger.warn(`${scriptsWithThreeArgsRequestUsage.length} scripts(s) using three argument in hooks and was detected "request" usage (manual check is needed and manual update if necessary), ${serializeObjectIds(scriptsWithThreeArgsRequestUsage)}`)
  logger.warn(`${scriptsWithThreeArgsResponseUsage.length} scripts(s) using three argument in hooks and was detected "response" usage (manual check is needed and manual update if necessary), ${serializeObjectIds(scriptsWithThreeArgsResponseUsage)}`)

  logger.info(`scripts detection was finished`)
}
