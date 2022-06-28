import ChangePasswordModal from './ChangePasswordModal.js'
import Studio from 'jsreport-studio'

export default (props) => {
  let ui = null

  if (Studio.authentication.user.isAdmin) {
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
