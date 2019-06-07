const winston = require('winston')

require('winston-loggly')

let logger

module.exports = {
  debug: (...args) => logger.debug.apply(logger, args),
  info: (...args) => logger.info.apply(logger, args),
  error: (...args) => logger.error.apply(logger, args),
  warn: (...args) => logger.warn.apply(logger, args),
  log: (...args) => logger.log.apply(logger, args)
}
module.exports.init = (jsreport) => {
  if (!jsreport.logger.transports.main) {
    jsreport.logger.add(winston.transports.File, {
      name: 'main',
      filename: 'reporter.log',
      maxsize: 10485760,
      json: false,
      level: 'debug'
    })

    jsreport.logger.add(winston.transports.Console, {
      level: 'debug'
    })

    if (jsreport.options.loggly.enabled) {
      jsreport.logger.add(winston.transports.Loggly, {
        level: jsreport.options.loggly.level,
        token: jsreport.options.loggly.token,
        subdomain: jsreport.options.loggly.subdomain,
        json: true,
        tags: ['jo']
      })
    }
  }

  const original = winston.Logger.prototype.log
  const originalLogglyLog = winston.transports.Loggly.prototype.log

  const ignore = Array.isArray(jsreport.options.logger.ignore) ? (
    jsreport.options.logger.ignore
  ) : (jsreport.options.logger.ignore || '').split(',')

  winston.transports.Loggly.prototype.log = function (...args) {
    if (args[2] != null && args[2].logglyIgnore === true) {
      delete args[2].logglyIgnore
      return args[3](null, true)
    }

    return originalLogglyLog.call(this, ...args)
  }

  winston.Logger.prototype.log = function (...args) {
    // we don't want message from phantom or scripts to be logged physically
    // just want to add it to the context so it is visible in debug extension
    // we can't just change the log level to silly, because in that case
    // winston doesn't run rewriter which adds logs to the context
    if (args[2] && args[2].timestamp && args[2].context) {
      const context = args[2].context
      context.logs = context.logs || []

      context.logs.push({
        level: args[0],
        message: args[1],
        timestamp: args[2].timestamp
      })

      return
    }

    if (args.length > 1 && args[1]) {
      if (ignore.filter((i) => args[1].includes(i)).length) {
        return
      }
    }

    return original.call(this, ...args)
  }

  logger = jsreport.logger
}
