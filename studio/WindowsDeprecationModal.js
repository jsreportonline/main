import React, { Component, PropTypes } from 'react'
import Studio from 'jsreport-studio'

export default class WindowsDeprecationModal extends Component {
  static propTypes = {
    close: PropTypes.func.isRequired,
    options: PropTypes.object.isRequired
  }

  async saveTenantInformed () {
    const { close } = this.props

    try {
      await Studio.api.post(`/api/tenant-windows-stopped-inform`, { })
      close()
    } finally {
      close()
    }
  }

  render () {
    return (
      <div>
        <p>
          <b>Important!</b> We migrated some of your templates from the old windows deprecated infrastructure to the current linux.
          You can find the details in <a target='_blank' href='https://jsreport.net/blog/stopping-windows-rendering-support-in-jsreportonline'>this blog post</a>.
        </p>
        <p>
          This change may cause layout issues because linux uses different sizes.
          In case you aren't able to quickly fix them, you can contact our support at support@jsreport.net and we can give you windows rendering temporarily back.
        </p>

        <div className='button-bar'>
          <button className='button confirmation' onClick={() => this.saveTenantInformed()}>ok</button>
        </div>
      </div>
    )
  }
}
