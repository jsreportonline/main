const awsSDK = require('aws-sdk')

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

      const bufs = []
      return new Promise((resolve, reject) => {
        s3.getObject(params)
          .createReadStream()
          .on('data', (b) => bufs.push(b))
          .on('error', (err) => {
            if (err.code === 'NoSuchKey') {
              return resolve(null)
            }
            reject(err)
          })
          .on('end', () => resolve(Buffer.concat(bufs)))
      })
    },

    remove (blobName) {
      const params = {
        Bucket: options.s3.bucket,
        Key: blobName
      }

      return new Promise((resolve, reject) => {
        s3.deleteObject(params, (err) => {
          if (err) {
            return reject(err)
          }

          resolve()
        })
      })
    }
  }
}

module.exports = (reporter) => {
  reporter.blobStorage.registerProvider(S3Storage(reporter.options))
}
