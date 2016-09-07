var logger = require('./logger')

module.exports = class Manager {
  constructor (options) {
    this.options = options
    this.workerUrls = options.workerUrls.split(' ')
    this.workers = this.workerUrls.map((u) => ({
      url: u,
      lastUsed: new Date()
    }))
  }

  executionFn (fn) {
    this.executionFn = fn
  }

  execute (tenant, body) {
    // TODO docker reset if it fails

    logger.debug(`Executing worker message for ${tenant}`)
    var worker = this.workers.find((w) => w.tenant === tenant)

    if (!worker || worker === -1) {
      logger.debug('Assigned worker not found, searching by LRU')
      worker = this.workers.reduce((prev, current) => (prev.lastUsed < current.lastUsed) ? prev : current)
    }

    logger.debug(`Worker url for message ${worker.url}`)

    worker.tenant = tenant
    worker.lastUsed = new Date()

    return this.executionFn(tenant, body, worker.url)
  }
}


