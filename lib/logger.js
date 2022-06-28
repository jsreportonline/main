const winston = require('winston')

require('winston-loggly-bulk')

let logger

module.exports = {
  debug: (...args) => logger.debug.apply(logger, args),
  info: (...args) => logger.info.apply(logger, args),
  error: (...args) => logger.error.apply(logger, args),
  warn: (...args) => logger.warn.apply(logger, args),
  log: (...args) => logger.log.apply(logger, args)
}

module.exports.init = (jsreport) => {
  const ignore = Array.isArray(jsreport.options.logger.ignore)
    ? (jsreport.options.logger.ignore)
    : (jsreport.options.logger.ignore || '').split(',')

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
    // we don't want message from phantom or scripts to be logged physically (for security reasons)
    // just want to add it to the context so it is visible in profile
    // we can't just change the log level to silly, because in that case
    // winston doesn't run rewriter which adds logs to the context
    if (info.context != null && info.timestamp != null) {
      const context = info.context

      context.logs = context.logs || []

      context.logs.push({
        level: info.level,
        message: info.message,
        timestamp: info.timestamp
      })

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
        process.stdout.isTTY && process.stdout.hasColors(256) ? winston.format.colorize() : winston.format(i => i)(),
        jsreport.logger.format
      )
    }))

    if (jsreport.options.loggly.enabled) {
      jsreport.logger.add(new winston.transports.Loggly({
        level: jsreport.options.loggly.level,
        token: jsreport.options.loggly.token,
        subdomain: jsreport.options.loggly.subdomain,
        json: true,
        tags: ['jo'],
        isBulk: true
      }))
    }
  }

  const originalLogglyLog = winston.transports.Loggly.prototype.log

  // we patch the Loggly log method to be able to stop some logs to be send ONLY to loggly,
  // but to be logged still to the other transports
  winston.transports.Loggly.prototype.log = function (...args) {
    if (args[0] != null && args[0].logglyIgnore === true) {
      delete args[0].logglyIgnore
      return args[1](null, true)
    }

    return originalLogglyLog.call(this, ...args)
  }

  logger = jsreport.logger
}
