import React, { Component } from 'react'
import style from './UpgradePlanModal.css'
import Studio from 'jsreport-studio'

class UpgradePlanModal extends Component {
  constructor (props) {
    super(props)
    this.state = {
      selected: Studio.authentication.user.tenant.plan || 'free'
    }
  }

  async submit () {
    // /api/payments/customer/:customerId/subscription/:productId
    if (this.state.selected === 'free' && Studio.authentication.user.tenant.plan != null && Studio.authentication.user.tenant.plan !== 'free') {
      if (!window.confirm('Are you sure you want to switch to the free plan and use limited credits? The change will have an immediate effect.')) {
        return
      }

      try {
        const res = await window.fetch('/api/payments/subscription', {
          method: 'DELETE'
        })

        const resJson = await res.json()

        if (!res.ok) {
          return alert(resJson.error)
        }
        return this.props.options.refresh()
      } catch (e) {
        return alert(e.message)
      } finally {
        this.props.close()
      }
    }

    if (!this.props.options.allowSelectCurrent && ((Studio.authentication.user.tenant.plan || 'free') === this.state.selected)) {
      return this.props.close()
    }

    if (window.confirm('We will now navigate you to the payment form')) {
      this.props.close()
      window.open(`https://jsreport.net/payments/checkout/email/${encodeURIComponent(Studio.authentication.user.tenant.email)}/jsreportonline/${this.state.selected}`)
    }
  }

  change (selected) {
    this.setState({ selected })
  }

  render () {
    const currentPlan = Studio.authentication.user.tenant.plan || 'free'
    return (
      <div style={{ width: '710px' }}>
        <h1>Select plan to upgrade</h1>
        <div className={style.plans}>
          <button onClick={() => this.change('free')} style={{ backgroundColor: '#60a917' }} className={this.state.selected === 'free' ? style.selected : ''}>
            <h3>FREE</h3>
            <hr />
            <span>monthly price</span>
            <h3>0 $ / no card</h3>
            <hr />
            <span>monthly credits *</span>
            <h3>200</h3>
          </button>
          <button onClick={() => this.change('bronze')} style={{ backgroundColor: '#00aba9' }} className={this.state.selected === 'bronze' ? style.selected : ''}>
            <h3>BRONZE</h3>
            <hr />
            <span>monthly price</span>
            <h3>29.95 $</h3>
            <hr />
            <span>monthly credits *</span>
            <h3>10 000</h3>
          </button>
          <button onClick={() => this.change('silver')} style={{ backgroundColor: '#647687' }} className={this.state.selected === 'silver' ? style.selected : ''}>
            <h3>SILVER</h3>
            <hr />
            <span>monthly price</span>
            <h3>99.95 $</h3>
            <hr />
            <span>monthly credits *</span>
            <h3>100 000</h3>
          </button>
          <button onClick={() => this.change('gold')} style={{ backgroundColor: '#e3c800' }} className={this.state.selected === 'gold' ? style.selected : ''}>
            <h3>GOLD</h3>
            <hr />
            <span>monthly price</span>
            <h3>299.95 $</h3>
            <hr />
            <span>monthly credits *</span>
            <h3>300 000</h3>
          </button>
        </div>

        <button className='button confirmation' style={{ marginTop: '0.5rem', marginLeft: '5px' }} onClick={() => this.submit()}>
          {this.state.selected === currentPlan && !this.props.options.allowSelectCurrent ? 'Close' : 'Process change'}
        </button>
      </div>
    )
  }
}

export default UpgradePlanModal
