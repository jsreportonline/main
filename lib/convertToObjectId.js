const mongodb = require('mongodb')
const ObjectId = mongodb.ObjectId

module.exports = (_id) => {
  if (ObjectId.isValid(_id)) {
    // if _id is already an ObjectID the constructor returns the same
    return new ObjectId(_id)
  }

  return _id
}
