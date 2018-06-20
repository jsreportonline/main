require('./lib/init')().catch((e) => {
  console.log(e.stack)
  process.exit(1)
})
