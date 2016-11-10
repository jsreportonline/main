const winston = require('winston')
const loggly = require('winston-loggly')

var logger

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

    jsreport.logger.rewriters.push((level, msg, meta) => {
      meta.stack = jsreport.options.stack
      meta.ip = jsreport.options.ip
      return meta
    })

    if (jsreport.options.loggly.enabled) {
      jsreport.logger.add(winston.transports.Loggly, {
        level: jsreport.options.loggly.level,
        token: jsreport.options.loggly.token,
        subdomain: jsreport.options.loggly.subdomain,
        json: true
      })
    }
  }

  const original = winston.Logger.prototype.log
  const ignore = jsreport.options.logger.ignore

  winston.Logger.prototype.log = function (...args) {
    if (args.filter((a) => a.timestamp).length) {
      //we don't want message from phantom or scripts to apear in the loggly
      args[0] = 'debug'
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





