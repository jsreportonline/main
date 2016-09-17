//var billing = require('../lib/billing.js')
//var should = require('should')
//
//describe('checkBilling', () => {
//  it('should charge when current day is billing day and did not yet charged', () => {
//    var tenant = {
//      createdOn: new Date(2014, 5, 5),
//      creditsSpent: 100,
//      lastBilledDate: new Date(2014, 5, 5)
//    }
//
//    var now = new Date(2014, 6, 5)
//
//    var update = billing.checkBilling(tenant, now)
//    update.should.be.ok
//    update.$set.lastBilledDate.should.be.eql(now)
//    update.$set.creditsSpent.should.be.eql(0)
//    update.$push.billingHistory.creditsSpent.should.be.eql(100)
//  })
//
//  it('should charge when the last billed day is way in past', () => {
//    var tenant = {
//      createdOn: new Date(2014, 5, 12),
//      creditsSpent: 100,
//      lastBilledDate: new Date(2014, 11, 11)
//    }
//
//    var now = new Date(2015, 3, 3)
//
//    var update = billing.checkBilling(tenant, now)
//    update.should.be.ok
//    update.$set.lastBilledDate.should.be.eql(now)
//    update.$set.creditsSpent.should.be.eql(0)
//    update.$push.billingHistory.creditsSpent.should.be.eql(100)
//  })
//
//  it('should charge when current day is the last day of the month and billing day is greater then current', () => {
//    var tenant = {
//      createdOn: new Date(2014, 0, 31),
//      creditsSpent: 100,
//      lastBilledDate: new Date(2014, 0, 31)
//    }
//
//    var now = new Date(2014, 3, 30)
//
//    var update = billing.checkBilling(tenant, now)
//    update.should.be.ok
//    update.$set.lastBilledDate.should.be.eql(now)
//    update.$set.creditsSpent.should.be.eql(0)
//    update.$push.billingHistory.creditsSpent.should.be.eql(100)
//  })
//
//  it('should NOT charge when already charged this month', () => {
//    var tenant = {
//      createdOn: new Date(2014, 5, 5),
//      creditsSpent: 100,
//      lastBilledDate: new Date(2014, 6, 4)
//    }
//
//    var now = new Date(2014, 6, 5)
//
//    var update = billing.checkBilling(tenant, now)
//    should(update).not.be.ok
//  })
//
//  it('should NOT charge when now month day lower', () => {
//    var tenant = {
//      createdOn: new Date(2014, 5, 5),
//      creditsSpent: 100,
//      lastBilledDate: new Date(2014, 5, 5)
//    }
//
//    var now = new Date(2014, 6, 4)
//
//    var update = billing.checkBilling(tenant, now)
//    should(update).not.be.ok
//  })
//})
//
//
