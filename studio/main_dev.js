import Studio from 'jsreport-studio'
import BillingEditor from './BillingEditor.js'
import BillingButton from './BillingButton.js'
import ChangePasswordSettingsButton from './ChangePasswordSettingsButton.js'

Studio.addEditorComponent('billing', BillingEditor)

Studio.previewListeners.push(() => {
  setTimeout(async () => {
    const response = await Studio.api.get('/api/settings')
    Studio.authentication.user.creditsUsed = response.tenant.creditsUsed
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

  Studio.addToolbarComponent(ChangePasswordSettingsButton, 'settings')
})

