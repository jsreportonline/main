const axios = require('axios')
const url = require('url')
const querystring = require('querystring')

const server = 'http://localtest.me:5488'
// const server = 'https://jsreportonline-test.net'
// eslint-disable-next-line node/no-deprecated-api
const serverUrl = url.parse(server)

const config = {
  numberOfAccounts: 10,
  iterations: 10
}

let accounts = []

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const createAccounts = async () => {
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
      terms: 'on'
    }))

  // eslint-disable-next-line no-unused-vars
  for (const account of accounts) {
    await axios({
      url: `${server}/register`,
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      data: querystring.stringify(account)
    })
  }
}

const invoiceData = {
  number: '123',
  seller: {
    name: 'Next Step Webs, Inc.',
    road: '12345 Sunny Road',
    country: 'Sunnyville, TX 12345'
  },
  buyer: {
    name: 'Acme Corp.',
    road: '16 Johnson Road',
    country: 'Paris, France 8060'
  },
  items: [{
    name: 'Website design',
    price: 300
  }],
  somethingBig: 'x'.padStart(1000 * 1000, 'x')
}

// eslint-disable-next-line no-unused-vars
for (let i = 0; i < 100; i++) {
  invoiceData.items.push({
    name: 'Website implementation',
    price: i
  })
}

const casesRun = [{
  template: {
    name: 'invoice-main',
    recipe: 'html'
  },
  data: invoiceData,
  options: {
    preview: true
  }
}, {
  template: {
    content: `{{#many}}
    {{#xlsxAdd "xl/worksheets/sheet1.xml" "worksheet.sheetData[0].row"}}
    <row>
        <c t="inlineStr"><is><t>Hello world</t></is></c>
        <c><v>11</v></c>
    </row>
    {{/xlsxAdd}}
    {{/many}}
    
    {{{xlsxPrint}}}`,
    helpers: `function many(opts) {
      var res = ''
    
      for (var i = 0; i < 1000; i++) {
        res += opts.fn(this)
      }
    
      return res
    }`,
    recipe: 'xlsx',
    engine: 'handlebars'
  },
  options: {
    preview: true
  }
}]

let renderCounter = 0
let successCounter = 0
let errorCounter = 0
let tooManyRequestsError = 0

const run = () => {
  console.log(`rendering reports (${config.iterations} report case(s) will be run per each account. total accounts: ${accounts.length})`)

  return Promise.all(accounts.map(async (a) => {
    await new Promise((resolve) => setTimeout(resolve, a.delay))

    for (let i = 0; i < config.iterations; i++) {
      const startTime = new Date().getTime()
      const item = Math.floor(Math.random() * casesRun.length)

      renderCounter++

      const requestNumber = renderCounter

      try {
        await axios({
          url: `${a.url}/api/report`,
          method: 'POST',
          data: casesRun[item],
          headers: {
            Authorization: a.authHeader
          }
        })

        successCounter++
        console.log(`Success! account: ${a.index}, case item: ${item}, render counter: ${requestNumber}, time: ${new Date().getTime() - startTime}ms`)
      } catch (e) {
        errorCounter++

        if (e.response?.status === 429) {
          tooManyRequestsError++
          console.log(`Failed! account: ${a.username}, case item: ${item}, render counter: ${requestNumber}. 429 error`)
        } else {
          console.error(`Failed! account: ${a.username}, case item ${item}, render counter: ${requestNumber}: ${e.toString()}`)
        }

        return new Promise((resolve) => setTimeout(resolve, 5000))
      }
    }
  }))
}

const start = new Date().getTime()

;(async () => {
  try {
    await createAccounts()

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
