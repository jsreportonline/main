import React, { Component, PropTypes } from 'react'
import Studio from 'jsreport-studio'

export default class ChangeEmailModal extends Component {
  static propTypes = {
    close: PropTypes.func.isRequired,
    options: PropTypes.object.isRequired
  }

  constructor () {
    super()
    this.state = { loading: false, completed: false }
  }

  componentDidMount () {
    if (this.refs.newEmail) {
      this.refs.newEmail.focus()
    }
  }

  componentWillUnmount () {
    if (this.completed) {
      window.location.reload()
    }
  }

  async changeEmail () {
    try {
      let data = {
        newEmail: this.refs.newEmail.value
      }

      this.setState({ loading: true })

      const response = await Studio.api.post(`/api/account-email`, { data: data })

      this.setState({ loading: false })

      this.refs.newEmail.value = ''

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
          <input type='email' ref='newEmail' onFocus={() => this.setState({ validationError: null, apiError: null })} />
        </div>
        <div className='form-group'>
          <span style={{ color: 'red', display: this.state.validationError ? 'block' : 'none' }}>{this.state.validationError}</span>
          <span style={{ color: 'red', display: this.state.apiError ? 'block' : 'none' }}>{this.state.apiError}</span>
        </div>
        <div className='button-bar'>
          <button className='button danger' disabled={loading} onClick={() => close()}>cancel</button>
          <button className='button confirmation' disabled={loading} onClick={() => this.changeEmail()}>save</button>
        </div>
      </div>
    )
  }
}
