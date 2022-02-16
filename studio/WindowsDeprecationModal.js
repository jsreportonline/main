import React, { Component, PropTypes } from 'react'
import Studio from 'jsreport-studio'

export default class WindowsDeprecationModal extends Component {
  static propTypes = {
    close: PropTypes.func.isRequired,
    options: PropTypes.object.isRequired
  }

  render () {
    const { templates } = this.props.options

    return (
      <div>
        <p>
          <b>Important!</b> jsreportonline is about to stop support for  windows based rendering.
        </p>
        <p>
          Please read more information <a target='_blank' href='https://jsreport.net/blog/stopping-windows-rendering-support-in-jsreportonline'>here</a>
        </p>
        {templates && (
          <div>
            The following templates are affected
            <ul>
              {templates.map((t) => (
                <li key={t._id}>{Studio.resolveEntityPath(t)}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }
}
