module.exports = class Manager {
  constructor (options) {
    this.options = options
    this.workerUrls = options.workerPorts.split(' ').map((p) => `http://${options.workerHost}:${p}`)
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

    var worker = this.workers.find((w) => w.tenant === tenant)

    if (!worker) {
      worker = this.workers.reduce((prev, current) => (prev.lastUsed < current.lastUsed) ? prev : current)
    }

    worker.tenant = tenant
    worker.lastUsed = new Date()

    return this.executionFn(tenant, body, worker.url)
  }
}


