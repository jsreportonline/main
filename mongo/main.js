module.exports = function (reporter, definition) {
  reporter.documentStore.provider = new (require('./provider'))(reporter.documentStore.model, reporter.options)
}
