const init = require('../lib/init')
const request = require('supertest')
require('should')

process.env = require('./basicOptions')

describe('routes', () => {
  let jsreport

  beforeEach(async () => {
    const j = await init()

    jsreport = j

    await Promise.all([
      jsreport.documentStore.provider.client.db(jsreport.options.db.databaseName).dropDatabase(),
      jsreport.documentStore.provider.client.db(jsreport.options.db.rootDatabaseName).dropDatabase()
    ])
  })

  afterEach(async () => {
    if (jsreport) {
      // NOTE: we are not calling .close because this calls mongoconnection.close() from jsreport-mongodb-store and causes
      // that tests throws Mongo error "Topology was destroyed", investigate this later
      // await jsreport.close()

      jsreport.express.server.close()
    }
  })

  it('GET /sign => 200', (done) => {
    request(jsreport.express.app)
      .get('/sign')
      .set('host', 'local.net')
      .expect(200, done)
  })

  it('GET / => 302 to /sign', function (done) {
    request(jsreport.express.app)
      .get('/')
      .set('host', 'local.net')
      .expect('location', /sign/)
      .expect(302, done)
  })

  it('GET /odata should response 401 for invalid credentials', (done) => {
    request(jsreport.express.app)
      .get('/odata/templates')
      .set('host', 'local.net')
      .expect(401, done)
  })

  it('POST /login with invalid password should redirect to login', (done) => {
    request(jsreport.express.app)
      .post('/login')
      .type('form')
      .set('host', 'local.net')
      .send({ username: 'xxxx@test.cz', password: 'xxx' })
      .expect('location', /sign/)
      .expect(302, done)
  })

  it('should auto login after register', (done) => {
    request(jsreport.express.app).post('/register')
      .type('form')
      .set('host', 'local.net')
      .send({ username: 'test@test.cz', name: 'joj', password: 'password', passwordConfirm: 'password', terms: true })
      .expect('location', '/sign')
      .end((err, res) => {
        if (err) {
          return done(err)
        }

        request(jsreport.express.app)
          .get('/')
          .set('host', 'local.net')
          .set('cookie', res.headers['set-cookie'])
          .expect('location', /joj/)
          .expect(302, done)
      })
  })

  describe('with registered tenant', () => {
    beforeEach((done) => {
      request(jsreport.express.app).post('/register')
        .type('form')
        .set('host', 'local.net')
        .send({ username: 'test@test.cz', name: 'joj', password: 'password', passwordConfirm: 'password', terms: true })
        .expect(302, done)
    })

    it('POST login and /odata => 200', (done) => {
      request(jsreport.express.app).post('/login')
        .type('form')
        .set('host', 'local.net')
        .send({ username: 'test@test.cz', password: 'password' })
        .end(function (err, res) {
          if (err) {
            return done(err)
          }

          request(jsreport.express.app).get('/odata/templates')
            .set('host', 'joj.local.net')
            .set('cookie', res.headers['set-cookie'])
            .expect(200, done)
        })
    })

    it('/api/settings with cookie on one account and Authorization header to second should return the second', (done) => {
      request(jsreport.express.app).post('/register')
        .type('form')
        .set('host', 'local.net')
        .send({ username: 'honza@honza.cz', name: 'honza', password: 'password', passwordConfirm: 'password', terms: true })
        .end(function (err, res) {
          if (err) {
            return done(err)
          }

          request(jsreport.express.app).post('/login')
            .type('form')
            .set('host', 'local.net')
            .send({ username: 'test@test.cz', password: 'password' })
            .end(function (err, res2) {
              if (err) {
                return done(err)
              }
              request(jsreport.express.app).get('/api/settings')
                .set('Authorization', `Basic ${Buffer.from('honza@honza.cz:password').toString('base64')}`)
                .set('host', 'honza.local.net')
                .set('cookie', res2.headers['set-cookie'])
                .expect(/honza/, done)
            })
        })
    })

    it('POST /login with valid password should redirect to subdomain', (done) => {
      request(jsreport.express.app).post('/login')
        .type('form')
        .set('host', 'local.net')
        .send({ username: 'test@test.cz', password: 'password' })
        .end(function (err, res) {
          if (err) {
            return done(err)
          }
          request(jsreport.express.app).get(res.header.location)
            .set('cookie', res.headers['set-cookie'])
            .end((err, res) => {
              if (err) {
                return done(err)
              }
              res.text.should.containEql('joj.')
              done()
            })
        })
    })

    it('GET /odata with basic authentication should response 200', (done) => {
      request(jsreport.express.app)
        .get('/odata/templates')
        .set('host', 'joj.local.net')
        .set('Authorization', `Basic ${Buffer.from('test@test.cz:password').toString('base64')}`)
        .expect(200, done)
    })
  })
})
