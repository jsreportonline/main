import ChangeEmailModal from './ChangeEmailModal.js'
import Studio from 'jsreport-studio'

function ChangeEmailSettingsButton (props) {
  let ui = null

  if (Studio.authentication.user.isAdmin) {
    ui = (
      <div>
        <a
          id='changeEmail'
          onClick={() => Studio.openModal(ChangeEmailModal, { entity: Studio.authentication.user })}
          style={{ cursor: 'pointer' }}
        >
          <i className='fa fa-at' /> Change email
        </a>
      </div>
    )
  }

  return ui
}

export default ChangeEmailSettingsButton
