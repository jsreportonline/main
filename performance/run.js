const request = require('request-promise')
const Promise = require('bluebird')
const fs = require('fs')
const path = require('path')
const url = require('url')
const _ = require('underscore')

const server = 'http://localtest.me:5488'
// const server = 'https://jsreportonline-test.net'
// eslint-disable-next-line node/no-deprecated-api
const serverUrl = url.parse(server)

const config = {
  numberOfAccounts: 10,
  iterations: 20
}

let accounts = []

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const createAccounts = () => {
  let counter = 0

  console.log(`creating ${config.numberOfAccounts} accounts`)

  accounts = new Array(config.numberOfAccounts)
    .fill(1)
    .map(() => Math.floor(Math.random() * 100000000))
    .map((id) => ({
      username: `${id}@perf.com`,
      url: `${serverUrl.protocol}//${id}.${serverUrl.hostname}${serverUrl.port ? ':' + serverUrl.port : ''}`,
      name: id,
      index: counter++,
      delay: (Math.random() * 10000),
      password: 'password',
      passwordConfirm: 'password',
      authHeader: `Basic ${Buffer.from(`${id}@perf.com:password`).toString('base64')}`,
      terms: true
    }))

  return Promise.map(accounts, (a) => request.post(`${server}/register`, {
    form: a,
    simple: false
  }), { concurrency: 1 })
}

const caseInvoice = (a) => {
  return request.post({
    url: `${a.url}/odata/templates`,
    body: {
      content: fs.readFileSync(path.join(__dirname, 'cases', 'invoice', 'content.html')).toString(),
      helpers: fs.readFileSync(path.join(__dirname, 'cases', 'invoice', 'helpers.js')).toString(),
      recipe: 'chrome-pdf',
      engine: 'jsrender',
      name: 'invoice'
    },
    json: true,
    headers: {
      Authorization: a.authHeader
    }
  })
}

const caseScript = (a) => {
  return request.post({
    url: `${a.url}/odata/scripts`,
    body: {
      content: fs.readFileSync(path.join(__dirname, 'cases', 'script', 'script.js')).toString(),
      name: 'script'
    },
    json: true,
    headers: {
      Authorization: a.authHeader
    }
  }).then((body) => {
    return request.post({
      url: `${a.url}/odata/templates`,
      body: {
        content: fs.readFileSync(path.join(__dirname, 'cases', 'script', 'content.html')).toString(),
        recipe: 'phantom-pdf',
        engine: 'handlebars',
        name: 'script',
        scripts: [{
          shortid: body.shortid
        }]
      },
      json: true,
      headers: {
        Authorization: a.authHeader
      }
    })
  })
}

const caseXlsx = (a) => {
  return request.post({
    url: `${a.url}/odata/templates`,
    body: {
      content: fs.readFileSync(path.join(__dirname, 'cases', 'xlsx', 'content.html')).toString(),
      helpers: fs.readFileSync(path.join(__dirname, 'cases', 'xlsx', 'helpers.js')).toString(),
      recipe: 'xlsx',
      engine: 'handlebars',
      name: 'xlsx'
    },
    json: true,
    headers: {
      Authorization: a.authHeader
    }
  })
}

const caseFop = (a) => {
  return request.post({
    url: `${a.url}/odata/templates`,
    body: {
      content: fs.readFileSync(path.join(__dirname, 'cases', 'fop', 'content.html')).toString(),
      helpers: fs.readFileSync(path.join(__dirname, 'cases', 'fop', 'helpers.js')).toString(),
      recipe: 'fop-pdf',
      engine: 'jsrender',
      name: 'fop'
    },
    json: true,
    headers: {
      Authorization: a.authHeader
    }
  })
}

const cases = [caseInvoice, caseScript, caseXlsx, caseFop]

const casesRun = [{
  template: {
    name: 'invoice'
  },
  data: JSON.parse(fs.readFileSync(path.join(__dirname, 'cases', 'invoice', 'data.json')).toString())
}, {
  template: {
    name: 'script',
    recipe: 'wkhtmltopdf'
  }
}, {
  template: {
    name: 'xlsx'
  }
}, {
  template: {
    content: fs.readFileSync(path.join(__dirname, 'cases', 'image', 'content.html')).toString(),
    recipe: 'phantom-pdf',
    engine: 'ejs'
  }
}, {
  template: {
    name: 'fop'
  }
}, {
  template: {
    content: '{{for numbers}}{{:#data}}{{/for}}',
    recipe: 'html',
    engine: 'jsrender'
  },
  data: {
    numbers: _.range(0, 1000000)
  }
}]

const createReports = () => {
  console.log('creating cases')

  return Promise.all(accounts.map((a) => Promise.all(cases.map((c) => c(a)))))
}

let renderCounter = 0
let successCounter = 0
let errorCounter = 0
let tooManyRequestsError = 0

const run = () => {
  console.log(`rendering reports (${config.iterations} report case(s) will be run per each account. total accounts: ${accounts.length})`)

  return Promise.all(accounts.map((a) => Promise.map(new Array(config.iterations).fill(1),
    () => Promise.delay(a.delay).then(() => {
      const startTime = new Date().getTime()
      const item = Math.floor(Math.random() * casesRun.length)

      renderCounter++

      const requestNumber = renderCounter

      return request.post({
        url: `${a.url}/api/report`,
        body: casesRun[item],
        json: true,
        headers: {
          Authorization: a.authHeader
        }
      }).then((body) => {
        successCounter++
        console.log(`Success! account: ${a.index}, case item: ${item}, render counter: ${requestNumber}, time: ${new Date().getTime() - startTime}ms`)
      }).catch((e) => {
        errorCounter++

        if (e.statusCode !== 429) {
          console.error(`Failed! account: ${a.index}, case item ${item}, render counter: ${requestNumber}: ${e.toString()}`)
        } else {
          tooManyRequestsError++
          console.log(`Failed! account: ${a.index}, case item: ${item}, render counter: ${requestNumber}. 429 error`)
        }
        return Promise.delay(5000)
      })
    }), { concurrency: 1 })
  ))
}

const start = new Date().getTime()

;(async () => {
  try {
    await createAccounts()
    await createReports()

    const renderStart = new Date().getTime()

    await run()

    console.log('done')
    const elapsedTime = new Date().getTime() - start
    const renderTime = new Date().getTime() - renderStart
    console.log(`Total Elapsed time ${elapsedTime} ms`)
    console.log(`Total Render time: ${renderTime} ms`)
    const numberOfReports = accounts.length * config.iterations
    console.log(`Rendered a total of ${numberOfReports} report(s)`)
    console.log(`Requests ok: ${successCounter}`)
    console.log(`Requests with error: ${errorCounter} (429 errors: ${tooManyRequestsError})`)
    console.log(`Reports per second ${numberOfReports / (renderTime / 1000)}`)
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
})()
