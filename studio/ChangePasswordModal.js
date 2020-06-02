import React, { Component, PropTypes } from 'react'
import Studio from 'jsreport-studio'

export default class ChangePasswordModal extends Component {
  static propTypes = {
    close: PropTypes.func.isRequired,
    options: PropTypes.object.isRequired
  }

  constructor () {
    super()
    this.state = {}
  }

  async changePassword () {
    const { close } = this.props

    try {
      let data = {
        newPassword: this.refs.newPassword1.value,
        oldPassword: this.refs.oldPassword.value
      }

      const response = await Studio.api.post(`/api/password`, { data: data })

      this.refs.newPassword1.value = ''
      this.refs.newPassword2.value = ''

      if (response.code !== 'ok') {
        this.setState({ validationError: response.code })
        return
      }

      close()
    } catch (e) {
      this.setState({ apiError: e.message })
    }
  }

  validatePassword () {
    this.setState(
      {
        passwordError: this.refs.newPassword2.value && this.refs.newPassword2.value !== this.refs.newPassword1.value,
        apiError: null
      })
  }

  render () {
    return <div>
      <div className='form-group'>
        <label>old password</label>
        <input type='password' ref='oldPassword' />
      </div>
      <div className='form-group'>
        <label>new password</label>
        <input type='password' ref='newPassword1' />
      </div>
      <div className='form-group'>
        <label>new password verification</label>
        <input type='password' ref='newPassword2' onChange={() => this.validatePassword()} />
      </div>
      <div className='form-group'>
        <span style={{ color: 'red', display: this.state.validationError ? 'block' : 'none' }}>{this.state.validationError}</span>
        <span style={{ color: 'red', display: this.state.passwordError ? 'block' : 'none' }}>password doesn't match</span>
        <span style={{ color: 'red', display: this.state.apiError ? 'block' : 'none' }}>{this.state.apiError}</span>
      </div>
      <div className='button-bar'>
        <button className='button confirmation' onClick={() => this.changePassword()}>ok</button>
      </div>
    </div>
  }
}
