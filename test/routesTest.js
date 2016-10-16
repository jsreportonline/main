const init = require('../lib/init')
const request = require('supertest')
const os = require('os')
const path = require('path')
require('should')

process.env = {
  debug: 'jsreport',
  NODE_ENV: 'development',
  tempDirectory: path.join(os.tmpdir(), 'jsreport'),
  connectionString: {
    rootDatabaseName: 'multitenant-root-test',
    databaseName: 'multitenant-test',
    uri: 'mongodb://localhost:27017/test'
  },
  aws: {
    accessKeyId: 'foo',
    secretAccessKey: 'foo'
  }
}

describe('routes', () => {
  var jsreport

  beforeEach((done) => {
    init().then((j) => (jsreport = j)).then(() => {
      jsreport.documentStore.provider.db.db(jsreport.options.connectionString.databaseName).dropDatabase()
      jsreport.documentStore.provider.db.db(jsreport.options.connectionString.rootDatabaseName).dropDatabase()
      done()
    }).catch(done)
  })

  afterEach(() => jsreport.express.server.close())

  it('GET /sign => 200', (done) => {
    request(jsreport.express.app).get('/sign').expect(200, done)
  })

  it('GET / => 302 to /sign', function (done) {
    request(jsreport.express.app)
      .get('/')
      .expect('location', /sign/)
      .expect(302, done)
  })

  it('GET /odata should response 401 for invalid credentials', (done) => {
    request(jsreport.express.app).get('/odata/templates')
      .expect(401, done)
  })

  it('POST /login with invalid password should redirect to login', (done) => {
    request(jsreport.express.app)
      .post('/login')
      .type('form')
      .send({ username: 'xxxx@test.cz', password: 'xxx' })
      .expect('location', /sign/)
      .expect(302, done)
  })

  it('should auto login after register', (done) => {
      request(jsreport.express.app).post('/register')
        .type('form')
        .send({ username: 'test@test.cz', name: 'joj', password: 'password', passwordConfirm: 'password', terms: true })
        .expect('location', '/sign')
        .end((err, res) => {
          if (err) {
            return done(err)
          }

          request(jsreport.express.app)
            .get('/')
            .set('cookie', res.headers['set-cookie'])
            .expect('location', /joj/)
            .expect(302, done)
        })
    })


  describe('with registered tenant', () => {
    beforeEach((done) => {
      request(jsreport.express.app).post('/register')
        .type('form')
        .send({ username: 'test@test.cz', name: 'joj', password: 'password', passwordConfirm: 'password', terms: true })
        .expect(302, done)
    })

    it('POST login and /odata => 200', (done) => {
      request(jsreport.express.app).post('/login')
        .type('form')
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

    it('POST /login with valid password should redirect to subdomain', (done) => {
      request(jsreport.express.app).post('/login')
        .type('form')
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
        .set('Authorization', `Basic ${new Buffer('test@test.cz:password').toString('base64')}`)
        .expect(200, done)
    })
  })
})
