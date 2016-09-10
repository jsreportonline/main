import ReactList from 'react-list'
import React, { Component} from 'react'
import Studio from 'jsreport-studio'

export default class ReportEditor extends Component {
  renderItem (index) {
    const item = Studio.authentication.user.billingHistory[index]
    return <tr key={index}>
      <td>{item.billedDate.toLocaleString()}</td>
      <td>{item.creditsSpent}</td>
    </tr>
  }

  renderItems (items, ref) {
    return <table className='table' ref={ref}>
      <thead>
        <tr>
          <th>billed date</th>
          <th>credits spent</th>
        </tr>
      </thead>
      <tbody>
        {items}
      </tbody>
    </table>
  }

  render () {
    return <div className='block custom-editor'>
      <div>
        <h1><i className='fa fa-home' /> {Studio.authentication.user.name} </h1>
        <small>created on: {Studio.authentication.user.createdOn.toLocaleString()}</small><br/>
        <small>admin email: {Studio.authentication.user.email}</small>
      </div>
      <div>
        <h2>current billing plan</h2>

        <button style={{marginLeft: '0rem'}} className='button confirmation'>
          {Studio.authentication.user.plan || 'free'} {Math.round(Studio.authentication.user.timeSpent / 1000)} / {Studio.authentication.user.creditsAvailable}
        </button>

        <button className='button danger' onClick={() => console.log('click')}>
          Upgrade plan
        </button>
      </div>
      <div className='block-item'>
        <h2>billing history</h2>
        <ReactList type='uniform' itemsRenderer={this.renderItems} itemRenderer={(index) => this.renderItem(index)} length={Studio.authentication.user.billingHistory.length} />
      </div>
    </div>
  }
}