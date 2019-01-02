const pMap = require('bluebird').map
const get = require('lodash.get')
const Request = require('jsreport-core').Request

module.exports = (jsreport, discriminatorPath) => {
  const fullState = {}

  jsreport.studio.addRequestLog = (request, info) => {
    const maxLogs = info.maxLogs

    const currentState = getCurrentState(
      fullState,
      request,
      discriminatorPath
    )

    if (currentState == null) {
      return
    }

    saveIntoState(currentState, 'requestsLog', {
      template: { shortid: request.template.shortid },
      timestamp: new Date().getTime(),
      logs: [...jsreport.studio.normalizeLogs(request.context.logs || [])]
    }, maxLogs)
  }

  jsreport.studio.addFailedRequestLog = (request, info) => {
    const error = info.error
    const maxLogs = info.maxLogs

    const currentState = getCurrentState(
      fullState,
      request,
      discriminatorPath
    )

    if (currentState == null) {
      return
    }

    saveIntoState(currentState, 'failedRequestsLog', {
      template: { shortid: request.template.shortid },
      timestamp: new Date().getTime(),
      logs: [...jsreport.studio.normalizeLogs(request.context.logs || [])],
      error: {
        message: error.message,
        stack: error.stack
      }
    }, maxLogs)
  }

  jsreport.studio.flushLogs = async (reporter, info) => {
    await flushLogs(reporter, fullState, info)
  }
}

async function flushLogs (reporter, fullState, info) {
  const maxLogs = info.maxLogs

  const toProcess = Object.keys(fullState).map((discriminator) => ({
    discriminator,
    state: fullState[discriminator]
  }))

  const errors = []

  await pMap(toProcess, async ({ discriminator, state }) => {
    try {
      const request = Request({
        context: {
          tenant: {
            name: discriminator
          }
        }
      })

      let requestsLog = (await reporter.settings.findValue('requestsLog', request)) || []
      let failedRequestsLog = (await reporter.settings.findValue('failedRequestsLog', request)) || []

      if (state.requestsLog.length > 0) {
        requestsLog.unshift(...state.requestsLog)
        state.requestsLog = []
        requestsLog = requestsLog.slice(0, maxLogs)

        await reporter.settings.addOrSet('requestsLog', requestsLog, request)
      }

      if (state.failedRequestsLog.length > 0) {
        failedRequestsLog.unshift(...state.failedRequestsLog)
        state.failedRequestsLog = []
        failedRequestsLog = failedRequestsLog.slice(0, maxLogs)

        await reporter.settings.addOrSet('failedRequestsLog', failedRequestsLog, request)
      }

      if (
        fullState[discriminator] &&
        fullState[discriminator].requestsLog.length === 0 &&
        fullState[discriminator].failedRequestsLog.length === 0
      ) {
        delete fullState[discriminator]
      }
    } catch (e) {
      // we catch the error but continue working in the other items to process,
      // this is important to don't block logs of other tenants to be inserted,
      // at the end if there were errors we throw just one general general
      errors.push(e)
    }
  }, { concurrency: 5 })

  if (errors.length > 0) {
    throw new Error(`[${errors.map((e) => e.message).join(', ')}]`)
  }
}

function getCurrentState (fullState, request, discriminatorPath) {
  let discriminator = get(request, discriminatorPath)
  let currentState

  if (discriminator == null) {
    return null
  }

  discriminator = String(discriminator)

  fullState[discriminator] = fullState[discriminator] || {}
  currentState = fullState[discriminator]

  currentState.requestsLog = currentState.requestsLog || []
  currentState.failedRequestsLog = currentState.failedRequestsLog || []

  return currentState
}

function saveIntoState (state, type, record, maxLogs) {
  state[type] = state[type] || []
  state[type].unshift(record)
  // we only store logs for the last five requests
  state[type] = state[type].slice(0, maxLogs)
}
