
module.exports = (objectIds) => {
  let result = '['

  if (objectIds.length === 0) {
    return ''
  }

  result += objectIds.map((_id) => `ObjectId('${_id}')`).join(', ')

  result += ']'

  return result
}
