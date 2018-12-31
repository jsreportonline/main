import Studio from 'jsreport-studio'
import BillingEditor from './BillingEditor.js'
import superagent from 'superagent'
import BillingButton from './BillingButton.js'
import ChangePasswordSettingsButton from './ChangePasswordSettingsButton.js'
import ContactEmailModal from './ContactEmailModal'

const localStorage = window.localStorage

Studio.addEditorComponent('billing', BillingEditor)

Studio.readyListeners.push(async () => {
  const creditsExceeded = Math.round(Studio.authentication.user.creditsUsed / 1000) > Studio.authentication.user.creditsAvailable

  const isModalUsed = () => {
    return Studio.isModalOpen()
  }

  const contactEmailNotRegistered = () => (
    Studio.authentication.user &&
    Studio.authentication.user.isAdmin &&
    Studio.authentication.user.contactEmail == null
  )

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

  if (creditsExceeded) {
    let intervalId

    creditsExceededModal()

    intervalId = setInterval(() => {
      if (!isModalUsed()) {
        clearInterval(intervalId)

        if (contactEmailNotRegistered()) {
          contactEmailModal()
        }
      }
    }, 2500)
  } else {
    if (
      !isModalUsed() &&
      contactEmailNotRegistered()
    ) {
      contactEmailModal()
    }
  }

  setInterval(checkMessages, 5 * 60 * 1000)
  checkMessages()
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
})
