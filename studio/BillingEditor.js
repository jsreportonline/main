import React, { Component } from 'react'
import Studio from 'jsreport-studio'
import UpgradePlanGumroadModal from './UpgradePlanGumroadModal.js'
import UpgradePlanModal from './UpgradePlanModal'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip
} from 'chart.js'
import { subYears } from 'date-fns'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip
)

function isGumroad () {
  return Studio.authentication.user.tenant.plan != null &&
  Studio.authentication.user.tenant.plan !== 'free' &&
  Studio.authentication.user.tenant.payments == null
}
class BillingEditor extends Component {
  onTabActive () {
    this.refresh()
  }

  componentDidMount () {
    window.addEventListener('focus', this.onFocus)
  }

  componentWillUnmount () {
    window.removeEventListener('focus', this.onFocus)
  }

  onFocus = () => {
    this.refresh()
  }

  async refresh () {
    if (this._loading) {
      return
    }
    this._loading = true

    try {
      const tenant = await Studio.api.get('/api/tenant')

      Studio.authentication.user.tenant.plan = tenant.plan
      Studio.authentication.user.tenant.creditsAvailable = tenant.creditsAvailable
      Studio.authentication.user.tenant.payments = tenant.payments
      this.forceUpdate()
    } finally {
      this._loading = false
    }
  }

  changePlan () {
    if (isGumroad()) {
      return Studio.openModal(UpgradePlanGumroadModal)
    }

    return Studio.openModal(UpgradePlanModal, {
      refresh: () => this.refresh()
    })
  }

  openPaymentDetails (event) {
    if (isGumroad()) {
      return window.open('https://gumroad.com/library', '_blank')
    }

    if (Studio.authentication.user.tenant.payments) {
      return window.open(`https://jsreport.net/payments/customer/${Studio.authentication.user.tenant.payments.customer.uuid}`, '_blank')
    }

    event.preventDefault()
  }

  gumroadNote () {
    return (
      <p>
        <small>
          The older accounts uses <a href='https://gumroad.com' rel='noreferrer' target='_blank'>gumroad.com</a> to mange jsreportonline payments and subscriptions.
          If you have any issues with payments, please contact gumroad support.<br /> If the plan upgrade is not propagated after
          several minutes, please contact jsreport support.<br /><br />

          <b>Please cancel the old subscription when upgrading between payed plans.</b>
        </small>
      </p>
    )
  }

  planColor () {
    switch (Studio.authentication.user.tenant.plan) {
      case 'bronze': return '#00aba9'
      case 'silver': return '#647687'
      case 'gold': return '#e3c800'
      default: return '#60a917'
    }
  }

  switchToOurBilling (e) {
    e.preventDefault()
    if (window.confirm('Billing from us is preferred, just please cancel your subscription at gumroad.com if you have one afterwards.')) {
      Studio.openModal(UpgradePlanModal, { refresh: () => this.refresh(), allowSelectCurrent: true })
    }
  }

  render () {
    return (
      <div className='block custom-editor' style={{ overflow: 'auto', minHeight: 0, height: 'auto' }}>
        <div>
          <h1><i className='fa fa-home' /> {Studio.authentication.user.tenant.name} </h1>
          <div style={{ marginBottom: '0.2rem' }}>created on: {Studio.authentication.user.tenant.createdOn.toLocaleDateString()}</div>
          <div style={{ marginBottom: '0.2rem' }}>admin email: {Studio.authentication.user.adminEmail}</div>
          {Studio.authentication.user.tenant.contactEmail != null && (
            <div>contact email: {Studio.authentication.user.tenant.contactEmail}</div>
          )}
        </div>
        <div>
          <h2>current plan</h2>

          <button className='button' style={{ marginTop: '0.25rem', marginLeft: '0rem', marginRight: '1rem', backgroundColor: this.planColor() }}>
            {Studio.authentication.user.tenant.plan || 'free'} {Math.round(Studio.authentication.user.tenant.creditsUsed / 1000) + ' '}
            / {Studio.authentication.user.tenant.creditsAvailable}

            <i style={{ marginLeft: '0.5rem' }} onClick={() => this.refresh()} className='fa fa-refresh' />
          </button>

          <h2>manage subscription</h2>

          {isGumroad() ? this.gumroadNote() : <div />}
          {Studio.authentication.user.tenant.plan !== 'free' && Studio.authentication.user.tenant.payments
            ? <div style={{ marginBottom: '0.5rem' }}>next payment: {Studio.authentication.user.tenant.payments.customer.product.subscription.nextPayment.toLocaleDateString()}</div>
            : <div />}

          <button className='button confirmation' style={{ marginTop: '0.25rem', marginLeft: '0rem', marginRight: '1rem' }} onClick={() => this.changePlan()}>
            Change plan
          </button>

          {(isGumroad() || Studio.authentication.user.tenant.payments)
            ? <a className='button confirmation' rel='noreferrer' enabl style={{ display: 'inline-block', marginTop: '0.25rem', marginLeft: '0rem', marginRight: '1rem' }} onClick={(event) => this.openPaymentDetails(event)}>Manage payments</a>
            : <span />}

          {isGumroad()
            ? <a className='button confirmation' rel='noreferrer' enabl style={{ display: 'inline-block', marginTop: '0.25rem', marginLeft: '0rem', marginRight: '1rem' }} onClick={(event) => this.switchToOurBilling(event)}>Switch from gumroad to jsreport billing</a>
            : <span />}
        </div>
        <div>
          <h2>billing history</h2>
          {this.usageChart()}
        </div>
      </div>
    )
  }

  usageChart () {
    const usageChartStart = subYears(new Date(), 1)
    const usage = Studio.authentication.user.tenant.billingHistory.filter((h) => h.billedDate > usageChartStart)
    usage.reverse()
    const data = {
      labels: usage.map(h => month[h.billedDate.getMonth()]),
      datasets: [
        {
          fill: true,
          data: usage.map(h => Math.round(h.creditsUsed / 1000)),
          borderColor: 'rgb(53, 162, 235)',
          backgroundColor: 'rgba(53, 162, 235, 0.5)'
        },
        {
          data: usage.map(h => Studio.authentication.user.tenant.creditsAvailable),
          borderColor: 'rgb(255, 0, 0)'
        }
      ]
    }
    const options = {
      animation: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              if (context.datasetIndex === 1) {
                return 'Plan available credits: ' + context.raw
              }

              return `Usage ${context.raw} billed on ${usage[context.dataIndex].billedDate.toDateString()}`
            }
          }
        }
      }
    }
    return (
      <Line options={options} data={data} />
    )
  }
}

const month = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default BillingEditor
