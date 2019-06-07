const mongodb = require('mongodb')
const ObjectID = mongodb.ObjectID

module.exports = (_id) => {
  if (ObjectID.isValid(_id)) {
    // if _id is already an ObjectID the constructor returns the same
    return new ObjectID(_id)
  }

  return _id
}
