import React, { Component } from 'react'
import Studio from 'jsreport-studio'
import UpgradePlanModal from './UpgradePlanModal.js'

export default class ReportEditor extends Component {
  openUpgradeModal () {
    Studio.openModal(UpgradePlanModal, {})
  }

  componentDidMount () {
    this.updatePlan()
  }

  async updatePlan () {
    if (this.updatePlanStarted) {
      return
    }
    this.updatePlanStarted = true
    Studio.startProgress()
    setTimeout(async () => {
      const response = await Studio.api.get('/api/settings')
      Studio.authentication.user.plan = response.tenant.plan
      Studio.authentication.user.creditsAvailable = response.tenant.creditsAvailable
      Studio.stopProgress()
      this.forceUpdate()
      this.updatePlanStarted = false
    }, 6000)
  }

  componentDidUpdate () {
    this.updatePlan()
  }

  render () {
    return <div className='block custom-editor' style={{ overflow: 'auto', minHeight: 0, height: 'auto' }}>
      <div>
        <h1><i className='fa fa-home' /> {Studio.authentication.user.name} </h1>
        <small><b>created on:</b> {Studio.authentication.user.createdOn.toLocaleString()}</small>
        <br />
        <small><b>admin email:</b> {Studio.authentication.user.email}</small>
        {Studio.authentication.user.contactEmail != null && (
          <br />
        )}
        {Studio.authentication.user.contactEmail != null && (
          <small><b>contact email:</b> {Studio.authentication.user.contactEmail}</small>
        )}
      </div>
      <div>
        <h2>current billing plan</h2>

        <button style={{ marginTop: '0.25rem', marginLeft: '0rem', marginRight: '1rem' }} className='button confirmation'>
          {Studio.authentication.user.plan || 'free'} {Math.round(Studio.authentication.user.creditsUsed / 1000) + ' '}
          / {Studio.authentication.user.creditsAvailable}
        </button>

        <button className='button confirmation' style={{ marginTop: '0.25rem', marginLeft: '0rem', marginRight: '1rem' }} onClick={() => this.openUpgradeModal()}>
          Upgrade plan
        </button>

        <a className='button confirmation' style={{ display: 'inline-block', marginTop: '0.25rem', marginLeft: '0rem', marginRight: '1rem' }} href='https://gumroad.com/library' target='_blank'>
          Payment details
        </a>

        <a className='button danger' style={{ display: 'inline-block', marginTop: '0.25rem', marginLeft: '0rem', marginRight: '1rem' }} href='https://gumroad.com/library' target='_blank'>
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
