const awsSDK = require('aws-sdk')
const Promise = require('bluebird')

class Storage {
  constructor (options) {
    this.s3 = new awsSDK.S3({
      accessKeyId: options.aws.accessKeyId,
      secretAccessKey: options.aws.secretAccessKey
    })
    this.options = options
  }

  write (defaultBlobName, buffer, request, response) {
    const blobName = `${request.tenant.name}/${defaultBlobName}`
    const params = {
      Bucket: this.options.s3.bucket,
      Key: blobName,
      Body: buffer
    }

    const self = this

    return new Promise((resolve, reject) => {
      self.s3.upload(params, (err, data) => {
        if (err) {
          return reject(err)
        }

        resolve(blobName)
      })
    })
  }

  read (blobName) {
    const params = {
      Bucket: this.options.s3.bucket,
      Key: blobName
    }

    return new Promise((resolve, reject) => {
      resolve(this.s3.getObject(params)
        .createReadStream()
        .on('error', (err) => reject(err)))
    })
  }
}

module.exports = (reporter) => {
  reporter.blobStorage = new Storage(reporter.options)
}
