import Studio from 'jsreport-studio'
import BillingEditor from './BillingEditor.js'
import BillingButton from './BillingButton.js'

Studio.addEditorComponent('billing', BillingEditor)

Studio.previewListeners.push(() => {
  setTimeout(async () => {
    const response = await Studio.api.get('/api/settings')
    Studio.authentication.user.timeSpent = response.tenant.timeSpent
  }, 5000)
})

Studio.initializeListeners.push(async () => {
  Studio.authentication.user.billingHistory = Studio.authentication.user.billingHistory || []

  Studio.addToolbarComponent(BillingButton, 'right')
  Studio.addToolbarComponent(() => <div
    className='toolbar-button'
    onClick={() => Studio.openTab({ key: 'Billing', editorComponentKey: 'billing', title: 'Billing' })}>
    <i className='fa fa-usd' /> Billing
  </div>, 'settings')
})