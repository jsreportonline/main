import React, {Component, PropTypes} from 'react'

export default class UpgradePlanModal extends Component {
  static propTypes = {
    close: PropTypes.func.isRequired,
    options: PropTypes.object.isRequired
  }

  render () {
    return (
      <div style={{ width: '710px', height: '640px' }}>
        <iframe src='/gumroad.html' style={{ width: '100%', height: '100%' }} frameBorder='0' />
      </div>
    )
  }
}
