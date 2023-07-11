import Studio from 'jsreport-studio'
import BillingEditor from './BillingEditor.js'
import BillingButton from './BillingButton.js'
import ChangePasswordSettingsButton from './ChangePasswordSettingsButton'
import ChangeEmailSettingsButton from './ChangeEmailSettingsButton'
import AboutModal from './AboutModal'

Studio.addEditorComponent('billing', BillingEditor)

Studio.setAboutModal(AboutModal)

Studio.readyListeners.push(() => {
  const pendingModalsLaunch = []
  const creditsExceeded = Math.round(Studio.authentication.user.tenant.creditsUsed / 1000) > Studio.authentication.user.tenant.creditsAvailable

  const creditsExceededModal = () => Studio.openModal((props) => {
    const creditsAvailable = Studio.authentication.user.tenant.creditsAvailable
    const creditsUsed = Math.round(Studio.authentication.user.tenant.creditsUsed / 1000)

    return (
      <div>
        <p>
          The monthly prepaid credits in your account has been exceeded.
          Please upgrade your <a href='https://jsreport.net/buy/online' rel='noreferrer' target='_blank'>jsreportonline plan</a> to avoid service interruption.
        </p>
        <p>
          <b>
            Available:{' '}
            <span style={{ color: '#008000' }}>{creditsAvailable}</span>
          </b>
          <br />
          <b>
            Used:{' '}
            <span style={{ color: '#c7a620' }}>{creditsUsed}</span>
          </b>
          <br />
          <b>
            Excess:{' '}
            <span style={{ color: '#ff0000' }}>{`${creditsUsed - creditsAvailable} (${Math.floor(((creditsUsed - creditsAvailable) / creditsAvailable) * 100)}%)`}</span>
          </b>
        </p>
        <div className='button-bar'>
          <button className='button confirmation' onClick={() => props.close()}>ok</button>
        </div>
      </div>
    )
  })

  // interval for modal launching
  setInterval(() => {
    if (pendingModalsLaunch.length === 0 || Studio.isModalOpen()) {
      return
    }

    const toLaunch = pendingModalsLaunch.splice(0, 1)

    toLaunch[0]()
  }, 300)

  if (creditsExceeded) {
    pendingModalsLaunch.push(creditsExceededModal)
  }

  if (Studio.authentication.user.tenant.plan !== 'free' && Studio.authentication.user.tenant.payments && Studio.authentication.user.tenant.payments.customer.product.subscription.plannedCancelation) {
    pendingModalsLaunch.push(() => Studio.openModal((props) => {
      return (
        <div>
          <p style={{ color: 'red' }}>The subscription renewal failed because the bank rejected the payment!</p>
          <p>Please visit the billing and update the payment, otherwise the subscription will be switched to the limited plan on {Studio.authentication.user.tenant.payments.customer.product.subscription.plannedCancelation.toLocaleDateString()}</p>
        </div>
      )
    }))
  }
})

Studio.initializeListeners.push(async () => {
  Studio.authentication.user.tenant.billingHistory = Studio.authentication.user.tenant.billingHistory || []
  Studio.authentication.user.tenant.billingHistory.sort((a, b) => b.billedDate.getTime() - a.billedDate.getTime())

  Studio.addToolbarComponent(BillingButton, 'right')

  Studio.addToolbarComponent(() => (
    <div className='toolbar-button'>
      <a href='https://jsreport.net/learn/online-faq' rel='noreferrer' target='_blank' style={{ color: 'inherit', textDecoration: 'none' }}>
        <i className='fa fa-info-circle' /> FAQ
      </a>
    </div>
  ), 'settings')

  Studio.addToolbarComponent(() => (
    <div
      className='toolbar-button'
      onClick={() => Studio.openTab({ key: 'Billing', editorComponentKey: 'billing', title: 'Billing' })}
    >
      <i className='fa fa-usd' /> Billing
    </div>
  ), 'settings')

  Studio.addToolbarComponent(ChangePasswordSettingsButton, 'settings')

  Studio.addToolbarComponent(ChangeEmailSettingsButton, 'settings')
})

let recipesDeprecationInformed = false
Studio.runListeners.push((request, entities) => {
  if (recipesDeprecationInformed) {
    return
  }

  if (request.template.recipe !== 'phantom-pdf' && request.template.recipe !== 'phantom-image' && request.template.recipe !== 'wkhtmltopdf' && request.template.recipe !== 'electron-pdf') {
    return
  }

  recipesDeprecationInformed = true
  Studio.openModal(() => (
    <div>
      The recipes phantom-pdf, phantom-image, wkhtmltopdf, and electron-pdf are deprecated.<br />
      We still keep them running, but in the future, we may need to stop the support because of the necessary OS updates which may break the recipes' underlying technologies.<br />
      Please consider migrating to chrome-based recipes.
    </div>
  ))
})
