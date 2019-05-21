import React, { Component, PropTypes } from 'react'

class AboutModal extends Component {
  static propTypes = {
    options: PropTypes.object.isRequired
  }

  render () {
    return (
      <div>
        <h2>About</h2>
      </div>
    )
  }
}

export default AboutModal
