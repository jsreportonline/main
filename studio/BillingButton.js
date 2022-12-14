import React, { Component } from 'react'
import Studio from 'jsreport-studio'

class BillingButton extends Component {
  openBilling () {
    Studio.openTab({ key: 'Billing', editorComponentKey: 'billing', title: 'Billing' })
  }

  componentDidMount () {
    this.interval = setInterval(() => this.forceUpdate(), 3000)
  }

  componentWillUnmount () {
    clearInterval(this.interval)
  }

  render () {
    return (
      <div onClick={() => this.openBilling()} className='toolbar-button'>
        <i className='fa fa-usd' /> {Math.round(Studio.authentication.user.tenant.creditsUsed / 1000)} / {Studio.authentication.user.tenant.creditsAvailable}
      </div>
    )
  }
}

export default BillingButton
