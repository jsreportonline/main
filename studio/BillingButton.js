import React, { Component } from 'react'
import Studio from 'jsreport-studio'

class BillingButton extends Component {
  openBilling () {
    Studio.openTab({ key: 'Billing', editorComponentKey: 'billing', title: 'Billing' })
  }

  render () {
    return (
      <div onClick={() => this.openBilling()} className='toolbar-button'>
        <i className='fa fa-usd' /> {Math.round(Studio.authentication.user.creditsUsed / 1000)} / {Studio.authentication.user.creditsAvailable}
      </div>
    )
  }
}

export default BillingButton
