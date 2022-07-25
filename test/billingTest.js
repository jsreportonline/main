const billing = require('../lib/main/billing.js')
const should = require('should')

describe('checkBilling', () => {
  it('should charge when current day is billing day and did not yet charged', () => {
    const tenant = {
      createdOn: new Date(2014, 5, 5),
      creditsUsed: 100,
      lastBilledDate: new Date(2014, 5, 5)
    }

    const now = new Date(2014, 6, 5)

    const update = billing.checkBilling(tenant, now)

    update.should.be.ok()
    update.$set.lastBilledDate.should.be.eql(now)
    update.$set.creditsUsed.should.be.eql(0)
    update.$push.billingHistory.creditsUsed.should.be.eql(100)
  })

  it('should charge when current day is the last day of the month and billing day is greater than current', () => {
    const tenant = {
      createdOn: new Date(2014, 0, 31),
      creditsUsed: 100,
      lastBilledDate: new Date(2014, 0, 31)
    }

    const now = new Date(2014, 3, 30)

    const update = billing.checkBilling(tenant, now)

    update.should.be.ok()
    update.$set.lastBilledDate.should.be.eql(now)
    update.$set.creditsUsed.should.be.eql(0)
    update.$push.billingHistory.creditsUsed.should.be.eql(100)
  })

  it('should NOT charge when already charged this month', () => {
    const tenant = {
      createdOn: new Date(2014, 5, 5),
      creditsUsed: 100,
      lastBilledDate: new Date(2014, 6, 4)
    }

    const now = new Date(2014, 6, 5)

    const update = billing.checkBilling(tenant, now)

    should(update).not.be.ok()
  })

  it('should NOT charge when now month day lower', () => {
    const tenant = {
      createdOn: new Date(2014, 5, 5),
      creditsUsed: 100,
      lastBilledDate: new Date(2014, 5, 5)
    }

    const now = new Date(2014, 6, 4)

    const update = billing.checkBilling(tenant, now)

    should(update).not.be.ok()
  })

  it('should NOT charge in the first day of the next year', () => {
    const tenant = {
      createdOn: new Date(2014, 4, 5),
      creditsUsed: 100,
      lastBilledDate: new Date(2014, 11, 5)
    }

    const now = new Date(2015, 0, 1)

    const update = billing.checkBilling(tenant, now)

    should(update).not.be.ok()
  })

  it('should charge in first month of the year', () => {
    const tenant = {
      createdOn: new Date(2014, 4, 5),
      creditsUsed: 100,
      lastBilledDate: new Date(2014, 11, 5)
    }

    const now = new Date(2015, 0, 6)

    const update = billing.checkBilling(tenant, now)

    should(update).be.ok()
  })
})
