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
          The windows based rendering is deprecated and will be removed in the future.
        </p>
        <p>
          Please read more information <a target='_blank' href='https://jsreport.net/learn/online-faq#windows-recipes'>here</a>
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
