function many(opts) {
  var res = ''

  for (var i = 0; i < 1000; i++) {
    res += opts.fn(this)
  }

  return res
}