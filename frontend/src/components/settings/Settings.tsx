import { useState, useEffect } from 'react';
import './Settings.css';
import useCurrentUser from '../../hooks/use-current-user';
import ProfilePictureUpload from '../common/profile-picture-upload/ProfilePictureUpload';
import type User from '../../models/user';
import useService from '../../hooks/use-service';
import ProfilePictureService from '../../services/auth-aware/ProfilePictureService';
import Spinner from '../common/spinner/Spinner';

export default function Settings() {
    const { user, isLoading: isLoadingUser } = useCurrentUser();
    const [currentUser, setCurrentUser] = useState<User | null>(user);
    const profilePictureService = useService(ProfilePictureService);

    useEffect(() => {
        setCurrentUser(user);
    }, [user]);

    const handleUploadComplete = async (updatedUser: User) => {
        setCurrentUser(updatedUser);
        // Optionally refresh the full user data
        try {
            const refreshedUser = await profilePictureService.getCurrentUser();
            setCurrentUser(refreshedUser);
        } catch (e) {
            console.error('Failed to refresh user data:', e);
        }
    };

    if (isLoadingUser || !currentUser) {
        return (
            <div className="Settings">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="Settings">
            <div className="settings-container">
                <h1>Settings</h1>
                
                <div className="settings-section">
                    <h2>Profile Picture</h2>
                    <p className="section-description">
                        Update your profile picture. Supported formats: JPEG, PNG, WebP, GIF. Max size: 5MB.
                    </p>
                    <ProfilePictureUpload 
                        user={currentUser} 
                        onUploadComplete={handleUploadComplete}
                        size={150}
                    />
                </div>

                <div className="settings-section">
                    <h2>Account Information</h2>
                    <div className="account-info">
                        <div className="info-item">
                            <span className="info-label">Username:</span>
                            <span className="info-value">{currentUser.username}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Name:</span>
                            <span className="info-value">{currentUser.name}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
