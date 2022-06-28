import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Studio from 'jsreport-studio'

class ChangeEmailModal extends Component {
  static propTypes = {
    close: PropTypes.func.isRequired,
    options: PropTypes.object.isRequired
  }

  constructor () {
    super()
    this.state = { loading: false, completed: false }
    this.newEmailRef = React.createRef()
  }

  componentDidMount () {
    if (this.newEmailRef.current) {
      this.newEmailRef.current.focus()
    }
  }

  componentWillUnmount () {
    if (this.completed) {
      window.location.reload()
    }
  }

  async changeEmail () {
    try {
      const data = {
        newEmail: this.newEmailRef.current.value
      }

      this.setState({ loading: true })

      const response = await Studio.api.post('/api/account-email', { data: data })

      this.setState({ loading: false })

      this.newEmailRef.current.value = ''

      if (response.code !== 'ok') {
        this.setState({ validationError: response.code })
        return
      }

      this.setState({ completed: true })
      this.completed = true
    } catch (e) {
      this.setState({ loading: false, apiError: e.message })
    }
  }

  confirm () {
    const { close } = this.props

    close()
    window.location.reload()
  }

  render () {
    const { close } = this.props
    const { loading, completed } = this.state

    if (completed) {
      return (
        <div key='info'>
          <div className='form-group'>
            <i>Email changed successfully. Now we need to reload the studio..</i>
          </div>
          <div className='button-bar'>
            <button autoFocus className='button confirmation' onClick={() => this.confirm()}>
              Ok
            </button>
          </div>
        </div>
      )
    }

    return (
      <div key='edit'>
        <p>
          Please understand the change of the administrator email can break your API calls in case you use it in the authorization header.
          In this case, we recommend creating a custom jsreport user and use it in the API calls instead.
        </p>
        <p>
          Afterward, it is safe to change the administrator email.
        </p>
        <p>
          Please note that after the email is changed, you will be logged out and log in will be required.
        </p>
        <div className='form-group'>
          <label>current email</label>
          <span><b>{Studio.authentication.user.username}</b></span>
        </div>
        <div className='form-group'>
          <label>new email</label>
          <input type='email' ref={this.newEmailRef} onFocus={() => this.setState({ validationError: null, apiError: null })} />
        </div>
        <div className='form-group'>
          <span style={{ color: 'red', display: this.state.validationError ? 'block' : 'none' }}>{this.state.validationError}</span>
          <span style={{ color: 'red', display: this.state.apiError ? 'block' : 'none' }}>{this.state.apiError}</span>
        </div>
        <div className='button-bar'>
          <button className='button danger' disabled={loading} onClick={() => this.changeEmail()}>Save</button>
          <button className='button confirmation' disabled={loading} onClick={() => close()}>Cancel</button>
        </div>
      </div>
    )
  }
}

export default ChangeEmailModal
