import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Studio from 'jsreport-studio'

class ContactEmailModal extends Component {
  static propTypes = {
    close: PropTypes.func.isRequired,
    options: PropTypes.object.isRequired
  }

  constructor (props) {
    super(props)

    this.state = {
      validationError: null,
      apiError: null
    }

    this.contactEmailRef = React.createRef()
  }

  async saveContactEmail () {
    const { close } = this.props

    try {
      const data = {
        contactEmail: this.contactEmailRef.current.value
      }

      const response = await Studio.api.post('/api/register-contact-email', { data: data })

      this.contactEmailRef.current.value = ''

      if (response.code !== 'ok') {
        this.setState({ validationError: response.code })
        return
      }

      close()
    } catch (e) {
      this.setState({ apiError: e.message })
    }
  }

  render () {
    return (
      <div>
        <p>
          We need to have a contact email in case of any notification about the service or to communicate directly if necessary.
          <br />
          Please provide the email of the person who is in charge of any use of the service
        </p>
        <div>
          <div className='form-group'>
            <label>Contact Email</label>
            <input type='text' placeholder='email...' ref={this.contactEmailRef} />
          </div>
          <div className='form-group'>
            <span style={{ color: 'red', display: this.state.validationError ? 'block' : 'none' }}>{this.state.validationError}</span>
            <span style={{ color: 'red', display: this.state.apiError ? 'block' : 'none' }}>{this.state.apiError}</span>
          </div>
          <div className='button-bar'>
            <button className='button confirmation' onClick={() => this.saveContactEmail()}>save</button>
          </div>
        </div>
      </div>
    )
  }
}

export default ContactEmailModal
