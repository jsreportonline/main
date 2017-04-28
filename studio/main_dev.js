import Studio from 'jsreport-studio'
import BillingEditor from './BillingEditor.js'
import superagent from 'superagent'
import BillingButton from './BillingButton.js'
import ChangePasswordSettingsButton from './ChangePasswordSettingsButton.js'

const localStorage = window.localStorage

Studio.addEditorComponent('billing', BillingEditor)

Studio.previewListeners.push(() => {
  setTimeout(async () => {
    const response = await Studio.api.get('/api/settings')
    Studio.authentication.user.creditsUsed = response.tenant.creditsUsed
  }, 5000)
})

Studio.readyListeners.push(async () => {
  const checkMessages = async () => {
    const request = superagent.get(Studio.resolveUrl('/api/message'))
    // eslint-disable-next-line handle-callback-err
    request.end((err, response) => {
      if (response && response.body) {
        const messageId = localStorage.getItem('messageId')

        if (messageId !== response.body.id) {
          localStorage.setItem('messageId', response.body.id)

          Studio.openModal((props) => (
            <div>
              <div dangerouslySetInnerHTML={{ __html: response.body.content }} />
              <div className='button-bar'>
                <button className='button confirmation' onClick={() => props.close()}>ok</button>
              </div>
            </div>
          ))
        }
      }
    })
  }

  setInterval(checkMessages, 5 * 60 * 1000)
  checkMessages()
})

Studio.initializeListeners.push(async () => {
  Studio.authentication.user.billingHistory = Studio.authentication.user.billingHistory || []

  Studio.addToolbarComponent(BillingButton, 'right')
  Studio.addToolbarComponent(() => <div
    className='toolbar-button'
    onClick={() => Studio.openTab({ key: 'Billing', editorComponentKey: 'billing', title: 'Billing' })}>
    <i className='fa fa-usd' /> Billing
  </div>, 'settings')

  Studio.addToolbarComponent(ChangePasswordSettingsButton, 'settings')
})
