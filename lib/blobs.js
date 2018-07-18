const awsSDK = require('aws-sdk')
const Promise = require('bluebird')

function S3Storage (options) {
  const s3 = new awsSDK.S3({
    accessKeyId: options.aws.accessKeyId,
    secretAccessKey: options.aws.secretAccessKey
  })

  return {
    init () {},

    write (defaultBlobName, buffer, request, response) {
      const blobName = `${request.context.tenant.name}/${defaultBlobName}`
      const params = {
        Bucket: options.s3.bucket,
        Key: blobName,
        Body: buffer
      }

      return new Promise((resolve, reject) => {
        s3.upload(params, (err, data) => {
          if (err) {
            return reject(err)
          }

          resolve(blobName)
        })
      })
    },

    read (blobName) {
      const params = {
        Bucket: options.s3.bucket,
        Key: blobName
      }

      return new Promise((resolve, reject) => {
        resolve(s3.getObject(params)
          .createReadStream()
          .on('error', (err) => reject(err)))
      })
    }
  }
}

module.exports = (reporter) => {
  reporter.blobStorage.registerProvider(S3Storage(reporter.options))
}
