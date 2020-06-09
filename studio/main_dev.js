import Studio from 'jsreport-studio'
import BillingEditor from './BillingEditor.js'
import superagent from 'superagent'
import BillingButton from './BillingButton.js'
import ChangePasswordSettingsButton from './ChangePasswordSettingsButton'
import ChangeEmailSettingsButton from './ChangeEmailSettingsButton'
import AboutModal from './AboutModal'
import WindowsDeprecationModal from './WindowsDeprecationModal'
import ContactEmailModal from './ContactEmailModal'

const localStorage = window.localStorage

Studio.addEditorComponent('billing', BillingEditor)

Studio.setAboutModal(AboutModal)

Studio.readyListeners.push(() => {
  const pendingModalsLaunch = []
  const creditsExceeded = Math.round(Studio.authentication.user.creditsUsed / 1000) > Studio.authentication.user.creditsAvailable

  const isModalUsed = () => {
    return Studio.isModalOpen()
  }

  const contactEmailNotRegistered = () => (
    Studio.authentication.user &&
    Studio.authentication.user.isAdmin &&
    Studio.authentication.user.contactEmail == null
  )

  const windowsDeprecationModal = (templates) => Studio.openModal(WindowsDeprecationModal, templates != null ? { templates } : undefined)

  const contactEmailModal = () => Studio.openModal(ContactEmailModal)

  const creditsExceededModal = () => Studio.openModal((props) => {
    let creditsAvailable = Studio.authentication.user.creditsAvailable
    let creditsUsed = Math.round(Studio.authentication.user.creditsUsed / 1000)

    return (
      <div>
        <p>
          The monthly prepaid credits in your account has been exceeded.
          Please upgrade your <a href='https://jsreport.net/buy/online' target='_blank'>jsreportonline plan</a> to avoid service interruption.
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

  const checkMessages = async () => {
    const request = superagent.get(Studio.resolveUrl('/api/message'))
    // eslint-disable-next-line handle-callback-err
    request.end((err, response) => {
      if (response && response.body) {
        const messageId = localStorage.getItem('messageId')

        if (isModalUsed()) {
          return
        }

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

  getTemplatesUsingWindowsExecution().then((templatesUsingWindowsExecution) => {
    if (templatesUsingWindowsExecution.length > 0) {
      pendingModalsLaunch.push(() => windowsDeprecationModal(templatesUsingWindowsExecution))
    }
  }).catch((e) => {
    console.error('Error trying to detect templates with windows execution:')
    console.error(e)
  })

  if (contactEmailNotRegistered()) {
    pendingModalsLaunch.push(contactEmailModal)
  }

  setInterval(checkMessages, 5 * 60 * 1000)
  checkMessages()

  Studio.previewListeners.push((request, entities) => {
    if (request.template.recipe !== 'phantom-pdf' && request.template.recipe !== 'wkhtmltopdf') {
      return
    }

    if (isTemplateUsingWindows(request.template)) {
      pendingModalsLaunch.push(windowsDeprecationModal)
    }
  })
})

Studio.initializeListeners.push(async () => {
  Studio.authentication.user.billingHistory = Studio.authentication.user.billingHistory || []
  Studio.authentication.user.billingHistory.sort((a, b) => b.billedDate.getTime() - a.billedDate.getTime())

  Studio.addToolbarComponent(BillingButton, 'right')

  Studio.addToolbarComponent(() => (
    <div className='toolbar-button'>
      <a href='https://jsreport.net/learn/online-faq' target='_blank' style={{ color: 'inherit', textDecoration: 'none' }}>
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

async function getTemplatesUsingWindowsExecution () {
  let templates = Studio.getReferences().templates.filter((t) => {
    return t.recipe === 'phantom-pdf' || t.recipe === 'wkhtmltopdf'
  })

  if (templates.length === 0) {
    return templates
  }

  templates = await Promise.all(templates.map(async (t) => {
    const freshTemplate = await Studio.loadEntity(t._id, true)
    return freshTemplate
  }))

  return templates.filter((t) => isTemplateUsingWindows(t))
}

function isTemplateUsingWindows (t) {
  if (t == null) {
    return false
  }

  const defaultPhantomjsChange = new Date(2016, 9, 18)
  let usingWindows = false
  let isOldTenant = false

  if (
    Studio.authentication.user.createdOn != null &&
    Studio.authentication.user.createdOn < defaultPhantomjsChange
  ) {
    isOldTenant = true
  }

  const phantomWin = (
    t.recipe === 'phantom-pdf' && ((
      t.phantom != null &&
      t.phantom.phantomjsVersion === '1.9.8-windows'
    ) || (
      // requests for old tenants should get the windows fallback
      isOldTenant &&
      (!t.phantom ||
      !t.phantom.phantomjsVersion)
    ))
  )

  const wkhtmltopdfWin = (
    t.recipe === 'wkhtmltopdf' &&
    t.wkhtmltopdf != null &&
    t.wkhtmltopdf.wkhtmltopdfVersion === '0.12.3-windows'
  )

  if (phantomWin || wkhtmltopdfWin) {
    usingWindows = true
  }

  return usingWindows
}
