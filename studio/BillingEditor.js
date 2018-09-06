import React, { Component } from 'react'
import Studio from 'jsreport-studio'
import UpgradePlanModal from './UpgradePlanModal.js'

export default class ReportEditor extends Component {
  openUpgradeModal () {
    this.upgradeModalOpenned = true
    Studio.openModal(UpgradePlanModal, {})
  }

  componentDidMount () {
    this.updatePlan()
  }

  async updatePlan () {
    Studio.startProgress()
    const response = await Studio.api.get('/api/settings')
    Studio.authentication.user.plan = response.tenant.plan
    Studio.authentication.user.creditsAvailable = response.tenant.creditsAvailable
    Studio.stopProgress()
    this.forceUpdate()
  }

  componentDidUpdate () {
    if (this.upgradeModalOpenned) {
      Studio.startProgress()
      setTimeout(() => this.updatePlan(), 6000)
    }

    this.upgradeModalOpenned = false
  }

  render () {
    return <div className='block custom-editor' style={{ overflow: 'auto', minHeight: 0, height: 'auto' }}>
      <div>
        <h1><i className='fa fa-home' /> {Studio.authentication.user.name} </h1>
        <small>created on: {Studio.authentication.user.createdOn.toLocaleString()}</small>
        <br />
        <small>admin email: {Studio.authentication.user.email}</small>
      </div>
      <div>
        <h2>current billing plan</h2>

        <button style={{marginLeft: '0rem'}} className='button confirmation'>
          {Studio.authentication.user.plan || 'free'} {Math.round(Studio.authentication.user.creditsUsed / 1000) + ' '}
          / {Studio.authentication.user.creditsAvailable}
        </button>

        <button className='button confirmation' onClick={() => this.openUpgradeModal()}>
          Upgrade plan
        </button>

        <a className='button confirmation' href='https://gumroad.com/library' target='_blank'>
          Payment details
        </a>

        <a className='button danger' href='https://gumroad.com/library' target='_blank'>
          Cancel subscription
        </a>

        <p>
          <small>
            We use <a href='https://gumroad.com' target='_blank'>gumroad.com</a> to mange jsreportonline payments and subscriptions.
            If you have any issues with payments, please contact gumroad support.<br /> If the plan upgrade is not propagated after
            several minutes, please contact jsreport support.<br /><br />

            <b>Please cancel the old subscription when upgrading between payed plans.</b>
          </small>
        </p>
      </div>
      <div>
        <h2>billing history</h2>
        <table className='table'>
          <thead>
            <tr>
              <th>billed date</th>
              <th>credits spent</th>
            </tr>
          </thead>
          <tbody>
            {Studio.authentication.user.billingHistory.map((item, index) =>
              <tr key={index}>
                <td>{item.billedDate.toLocaleString()}</td>
                <td>{Math.round(item.creditsUsed / 1000)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  }
}
