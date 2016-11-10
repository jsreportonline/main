const request = require('request-promise')
const Promise = require('bluebird')
const fs = require('fs')
const path = require('path')
const url = require('url')
const _ = require('underscore')

//const server = 'http://local.net:5488'
const server = 'https://jsreportonline-test.net'
const serverUrl = url.parse(server)

const config = {
  numberOfAccounts: 8,
  iterations: 2000
}

var accounts = []
var templates

const createAccounts = () => {
  var counter = 0
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
      authHeader: `Basic ${new Buffer(`${id}@perf.com:password`).toString('base64')}`,
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
      recipe: 'phantom-pdf',
      engine: 'jsrender',
      name: 'invoice'
    },
    json: true,
    headers: {
      'Authorization': a.authHeader
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
      'Authorization': a.authHeader
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
        'Authorization': a.authHeader
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
      'Authorization': a.authHeader
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
      'Authorization': a.authHeader
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

var renderCounter = 0;
var errorCounter = 1;
const run = () => {
  console.log('rendering reports')
  return Promise.all(accounts.map((a) => Promise.map(new Array(config.iterations).fill(1),
      () => Promise.delay(a.delay).then(() => {
        const startTime = new Date().getTime()
        const item = Math.floor(Math.random() * casesRun.length)
        return request.post({
          url: `${a.url}/api/report`,
          body: casesRun[item],
          json: true,
          headers: {
            'Authorization': a.authHeader
          }
        }).then((body) => {
          console.log(`${a.index}: ${++renderCounter}:${new Date().getTime() - startTime}`)
        }).catch((e) => {
          if (e.statusCode !== 429) {
            console.error('Failed item + ' + item + ' : ' + e.toString())
          }
          //process.exit()
          console.log(`${a.index}: error: ${++errorCounter}`)
          return Promise.delay(5000)
        })
      }), { concurrency: 1 })
  ))
}

const start = new Date().getTime()
createAccounts()
  .then(createReports)
  .then(run)
  .then(() => {
    console.log('done')
    const elapsedTime = new Date().getTime() - start
    console.log(`Elapsed time ${elapsedTime} ms`)
    const numberOfReports = cases.length * accounts.length * config.iterations
    console.log(`Reports per second ${numberOfReports / (elapsedTime / 1000)}`)
  })
  .catch((e) => {throw e})