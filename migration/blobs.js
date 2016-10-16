const path = require('path')
const stream = require('stream')
const awsSDK = require('aws-sdk')
const Promise = require('bluebird')
const toArray = Promise.promisify(require('stream-to-array'))

const jsreport = require('jsreport-core')({
  loadConfig: true,
  connectionString: {
    name: 'mongoDB',
    address: 'localhost',
    databaseName: 'multitenant'
  },
  rootDirectory: path.join(__dirname, '../'),
  blobStorage: 'gridFS'
})

jsreport.use(require('jsreport-mongodb-store')())
jsreport.use(require('jsreport-templates')())
jsreport.use(require('jsreport-reports')())

const s3 = new awsSDK.S3({
  accessKeyId: process.env['aws:accessKeyId'],
  secretAccessKey: process.env['aws:secretAccessKey']
})

s3.upload = Promise.promisify(s3.upload).bind(s3)

console.log('starting migration')

jsreport.init().then(() => {
  return jsreport.documentStore.collection('reports').find({}).then((reports) => {
    var total = reports.length
    return Promise.map(reports.slice(0), (report) => {
      return jsreport.blobStorage.read(report.blobName).then((stream) => {
        const blobName = `${report.tenantId}/${report.blobName}`
        console.log(blobName)

        return toArray(stream).then((arr) => {
          const buffer = Buffer.concat(arr)
          const params = {
            Bucket: 'jsreportonline',
            Key: blobName,
            Body: buffer
          }

          return s3.upload(params).then(() => console.log(--total))
        })
      }).catch((e) => {
        console.error(e)
      })
    }, { concurrency: 4 })
  })
}).catch((e) => {
  console.error(e)
})
