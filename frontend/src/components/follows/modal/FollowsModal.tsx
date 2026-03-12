import type User from "../../../models/user";
import Follow from "../follow/Follow";
import "./FollowsModal.css";

interface FollowsModalProps {
    isOpen: boolean
    onClose(): void
    title: string
    users: User[]
}

export default function FollowsModal(props: FollowsModalProps) {
    const { isOpen, onClose, title, users } = props;

    if (!isOpen) return null;

    return (
        <div className="follows-modal-overlay" onClick={onClose}>
            <div className="follows-modal" onClick={event => event.stopPropagation()}>
                <div className="follows-modal-header">
                    <h3 className="follows-modal-title">{title}</h3>
                    <button className="follows-modal-close" onClick={onClose} aria-label="Close modal">
                        ×
                    </button>
                </div>
                <div className="follows-modal-body">
                    {users.length === 0 && <p className="follows-modal-empty">No users to show.</p>}
                    {users.map(user => (
                        <Follow key={user.id} user={user} onNavigateToProfile={onClose} />
                    ))}
                </div>
            </div>
        </div>
    );
}
