import type User from '../../../models/user';
import { getProfilePictureUrl } from '../../../utils/profile-picture';
import './ProfilePicture.css';

interface ProfilePictureProps {
    user: User;
    size?: number;
    className?: string;
}

export default function ProfilePicture({ user, size = 40, className = '' }: ProfilePictureProps) {
    const imageUrl = getProfilePictureUrl(user.profilePicture);

    return (
        <img
            src={imageUrl}
            alt={user.name || 'User avatar'}
            className={`profile-picture ${className}`}
            style={{ width: `${size}px`, height: `${size}px` }}
        />
    );
}
