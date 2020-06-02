import ChangeEmailModal from './ChangeEmailModal.js'
import Studio from 'jsreport-studio'

export default (props) => {
  return Studio.authentication.user.isAdmin ? (
    <div>
      <a
        id='changeEmail'
        onClick={() => Studio.openModal(ChangeEmailModal, { entity: Studio.authentication.user })}
        style={{ cursor: 'pointer' }}><i className='fa fa-at' /> Change email
      </a>
    </div>
  ) : <div />
}
