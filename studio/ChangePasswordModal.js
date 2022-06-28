import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Studio from 'jsreport-studio'

class ChangePasswordModal extends Component {
  static propTypes = {
    close: PropTypes.func.isRequired,
    options: PropTypes.object.isRequired
  }

  constructor () {
    super()
    this.state = {}
    this.oldPasswordRef = React.createRef()
    this.newPassword1Ref = React.createRef()
    this.newPassword2Ref = React.createRef()
  }

  async changePassword () {
    const { close } = this.props

    try {
      const data = {
        newPassword: this.newPassword1Ref.current.value,
        oldPassword: this.oldPasswordRef.current.value
      }

      const response = await Studio.api.post('/api/password', { data: data })

      this.newPassword1Ref.current.value = ''
      this.newPassword2Ref.current.value = ''

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
        passwordError: this.newPassword2Ref.current.value && this.newPassword2Ref.current.value !== this.newPassword1Ref.current.value,
        apiError: null
      })
  }

  render () {
    return (
      <div>
        <div className='form-group'>
          <label>old password</label>
          <input type='password' ref={this.oldPasswordRef} />
        </div>
        <div className='form-group'>
          <label>new password</label>
          <input type='password' ref={this.newPassword1Ref} />
        </div>
        <div className='form-group'>
          <label>new password verification</label>
          <input type='password' ref={this.newPassword2Ref} onChange={() => this.validatePassword()} />
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
    )
  }
}

export default ChangePasswordModal
