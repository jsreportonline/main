var billing = require('../lib/billing.js')
var should = require('should')

describe('checkBilling', () => {
  it('should charge when current day is billing day and did not yet charged', () => {
    var tenant = {
      createdOn: new Date(2014, 5, 5),
      creditsUsed: 100,
      lastBilledDate: new Date(2014, 5, 5)
    }

    var now = new Date(2014, 6, 5)

    var update = billing.checkBilling(tenant, now)
    update.should.be.ok()
    update.$set.lastBilledDate.should.be.eql(now)
    update.$set.creditsUsed.should.be.eql(0)
    update.$push.billingHistory.creditsUsed.should.be.eql(100)
  })   

  it('should charge when current day is the last day of the month and billing day is greater then current', () => {
    var tenant = {
      createdOn: new Date(2014, 0, 31),
      creditsUsed: 100,
      lastBilledDate: new Date(2014, 0, 31)
    }

    var now = new Date(2014, 3, 30)

    var update = billing.checkBilling(tenant, now)
    update.should.be.ok()
    update.$set.lastBilledDate.should.be.eql(now)
    update.$set.creditsUsed.should.be.eql(0)
    update.$push.billingHistory.creditsUsed.should.be.eql(100)
  })

  it('should NOT charge when already charged this month', () => {
    var tenant = {
      createdOn: new Date(2014, 5, 5),
      creditsUsed: 100,
      lastBilledDate: new Date(2014, 6, 4)
    }

    var now = new Date(2014, 6, 5)

    var update = billing.checkBilling(tenant, now)
    should(update).not.be.ok()
  })

  it('should NOT charge when now month day lower', () => {
    var tenant = {
      createdOn: new Date(2014, 5, 5),
      creditsUsed: 100,
      lastBilledDate: new Date(2014, 5, 5)
    }

    var now = new Date(2014, 6, 4)

    var update = billing.checkBilling(tenant, now)
    should(update).not.be.ok()
  })

  it('should NOT charge in the first day of the next year', () => {
    var tenant = {
      createdOn: new Date('2014-05-05'),
      creditsUsed: 100,
      lastBilledDate: new Date('2014-12-05')
    }    

    var now = new Date('2015-01-01')

    var update = billing.checkBilling(tenant, now)
    should(update).not.be.ok()
  })

  it('should charge in first month of the year', () => {
    var tenant = {
      createdOn: new Date('2014-05-05'),
      creditsUsed: 100,
      lastBilledDate: new Date('2014-12-05')
    }    

    var now = new Date('2015-01-06')

    var update = billing.checkBilling(tenant, now)
    should(update).be.ok()
  })
})


