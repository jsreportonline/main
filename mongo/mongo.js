var main = require('./main')

module.exports = function (options) {
  return {
    options: options,
    main: main,
    name: 'mongo',
    dependencies: [],
    directory: __dirname
  }
}