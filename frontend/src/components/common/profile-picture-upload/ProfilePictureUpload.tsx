import { useState, useRef } from 'react';
import type User from '../../../models/user';
import { getProfilePictureUrl } from '../../../utils/profile-picture';
import useService from '../../../hooks/use-service';
import ProfilePictureService from '../../../services/auth-aware/ProfilePictureService';
import SpinnerButton from '../spinner-button/SpinnerButton';
import { useAppDispatcher } from '../../../redux/hooks';
import { updateUserProfilePicture as profileUpdateUserProfilePicture } from '../../../redux/profile-slice';
import { updateUserProfilePicture as feedUpdateUserProfilePicture } from '../../../redux/feed-slice';
import { updateUserProfilePicture as followersUpdateUserProfilePicture } from '../../../redux/followers-slice';
import { updateUserProfilePicture as followingUpdateUserProfilePicture } from '../../../redux/following-slice';
import useUserId from '../../../hooks/use-user-id';
import './ProfilePictureUpload.css';

interface ProfilePictureUploadProps {
    user: User;
    onUploadComplete?: (updatedUser: User) => void;
    size?: number;
}

export default function ProfilePictureUpload({ user, onUploadComplete, size = 120 }: ProfilePictureUploadProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const profilePictureService = useService(ProfilePictureService);
    const dispatch = useAppDispatcher();
    const userId = useUserId();

    const currentImageUrl = getProfilePictureUrl(user.profilePicture);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            setError('Please select a valid image file (JPEG, PNG, WebP, or GIF)');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Image size must be less than 5MB');
            return;
        }

        setError(null);
        setPreview(URL.createObjectURL(file));
    };

    const handleUpload = async () => {
        const file = fileInputRef.current?.files?.[0];
        if (!file) {
            setError('Please select an image file');
            return;
        }

        // Optimistic update: Show preview immediately (already done in handleFileChange)
        try {
            setIsUploading(true);
            setError(null);
            const updatedUser = await profilePictureService.uploadProfilePicture(file);
            
            // Update Redux immediately for local state update (socket event will be ignored for current user)
            if (userId) {
                const updatePayload = { userId, profilePicture: updatedUser.profilePicture ?? null };
                dispatch(profileUpdateUserProfilePicture(updatePayload));
                dispatch(feedUpdateUserProfilePicture(updatePayload));
                dispatch(followersUpdateUserProfilePicture(updatePayload));
                dispatch(followingUpdateUserProfilePicture(updatePayload));
            }
            
            setPreview(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            onUploadComplete?.(updatedUser);
        } catch (e: any) {
            // Rollback on error - clear preview to show original image
            setPreview(null);
            setError(e?.response?.data?.message || 'Failed to upload profile picture. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleCancel = () => {
        setPreview(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="profile-picture-upload">
            <div className="profile-picture-preview">
                <img
                    src={preview || currentImageUrl}
                    alt="Profile picture"
                    style={{ width: `${size}px`, height: `${size}px` }}
                />
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="profile-picture-input"
            />

            <div className="profile-picture-actions">
                {!preview ? (
                    <label htmlFor="profile-picture-input" className="change-picture-btn">
                        Change Profile Picture
                    </label>
                ) : (
                    <>
                        <SpinnerButton
                            onClick={handleUpload}
                            buttonText="Upload"
                            loadingText="Uploading..."
                            isSubmitting={isUploading}
                        />
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="cancel-btn"
                            disabled={isUploading}
                        >
                            Cancel
                        </button>
                    </>
                )}
            </div>

            {error && <div className="error-message">{error}</div>}
        </div>
    );
}
