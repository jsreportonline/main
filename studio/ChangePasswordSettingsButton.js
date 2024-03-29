import ChangePasswordModal from './ChangePasswordModal.js'
import Studio from 'jsreport-studio'

function ChangePasswordSettingsButton (props) {
  let ui = null

  if (Studio.authentication.user.isSuperAdmin) {
    ui = (
      <div>
        <a
          id='changePassword'
          onClick={() => Studio.openModal(ChangePasswordModal, { entity: Studio.authentication.user })}
          style={{ cursor: 'pointer' }}
        >
          <i className='fa fa-key' /> Change password
        </a>
      </div>
    )
  }

  return ui
}

export default ChangePasswordSettingsButton
