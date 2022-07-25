const winston = require('winston')

let logger

module.exports = {
  debug: (...args) => logger.debug.apply(logger, args),
  info: (...args) => logger.info.apply(logger, args),
  error: (...args) => logger.error.apply(logger, args),
  warn: (...args) => logger.warn.apply(logger, args),
  log: (...args) => logger.log.apply(logger, args)
}

module.exports.init = (jsreport) => {
  const ignore = (Array.isArray(jsreport.options.logger.ignore)
    ? (jsreport.options.logger.ignore)
    : (jsreport.options.logger.ignore || '').split(',')).filter((m) => m != null && m !== '')

  // add jo properties to the logs
  const addJoPropsToLogs = winston.format((info) => {
    info.stack = jsreport.options.stack
    info.ip = jsreport.options.ip

    if (info.context != null) {
      info.requestId = info.context.id
      info.tenant = info.context.tenant.name
    }

    return info
  })

  const ignoreLogs = winston.format((info) => {
    // we don't want message from phantom, chrome or scripts to be logged physically (for security reasons)
    // we filter it here so they don't get logged on transports
    if (info.context != null && info.userLevel === true) {
      return false
    }

    // ignore messages that includes certain pattern
    if (ignore.filter((i) => info.message.includes(i)).length) {
      return false
    }

    return info
  })

  jsreport.logger.format = winston.format.combine(
    addJoPropsToLogs(),
    ignoreLogs(),
    jsreport.logger.format
  )

  if (!jsreport.logger.transports.main) {
    jsreport.logger.add(new winston.transports.File({
      name: 'main',
      filename: 'reporter.log',
      maxsize: 10485760,
      level: 'debug'
    }))

    jsreport.logger.add(new winston.transports.Console({
      level: 'debug',
      format: winston.format.combine(
        winston.format.colorize(),
        jsreport.logger.format
      )
    }))
  }

  logger = jsreport.logger
}
