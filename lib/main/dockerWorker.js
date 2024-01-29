
module.exports = (reporter, onError) => {
  const _dockerWorkersManagerFactory = reporter._workersManagerFactory
  const authOptions = reporter.options.extensions.authentication

  if (authOptions?.admin?.username == null) {
    throw new Error('jo extension requires extensions.authentication.admin.username to be set')
  }

  if (authOptions?.admin?.password == null) {
    throw new Error('jo extension requires extensions.authentication.admin.password to be set')
  }

  reporter.registerWorkersManagerFactory((options, systemOptions) => {
    const dockerManager = _dockerWorkersManagerFactory(options, systemOptions)

    const originalDockerManagerAllocate = dockerManager.allocate

    dockerManager.allocate = async (req, opts = {}) => {
      let worker

      try {
        worker = await originalDockerManagerAllocate(req, opts)
      } catch (allocateErr) {
        const customError = onError({ type: 'allocate', error: allocateErr, req })

        if (customError) {
          throw customError
        }

        throw allocateErr
      }

      const originalWorkerExecute = worker.execute

      worker.execute = async function execute (userData, options) {
        try {
          const result = await originalWorkerExecute(userData, options)
          return result
        } catch (executeError) {
          const customError = onError({ type: 'execute', error: executeError, req })

          if (customError) {
            throw customError
          }

          throw executeError
        }
      }

      return worker
    }

    return dockerManager
  })
}
