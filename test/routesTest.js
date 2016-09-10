const init = require('../lib/init')
const request = require('supertest')
require('should')

process.env = {
  debug: 'jsreport',
  NODE_ENV: 'development',
  tasks: {
    workerUrls: 'localhost:3000'
  },
  phantom: {
    workerUrls: 'localhost:4000'
  }
}

describe('routes', () => {
  var jsreport

  beforeEach((done) => {
    init().then((j) => (jsreport = j)).then(() => done()).catch(done)
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
      .send({ username: 'xxxx@test.cz' })
      .end(function (err, res) {
        if (err) {
          return done(err)
        }

        request(jsreport.express.app).get(res.header.location)
          .set('cookie', res.headers['set-cookie'])
          .expect('location', /sign/)
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

    it('GET login and /odata => 200', (done) => {
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
        .set('Authorization', `Basic ${new Buffer('test@test.com:password').toString('base64')}`)
        .expect(200, done)
    })
  })
})
