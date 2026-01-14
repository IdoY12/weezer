import getImageUrl from '../hooks/use-image';

const DEFAULT_AVATAR_URL = 'https://static.vecteezy.com/system/resources/previews/036/594/092/non_2x/man-empty-avatar-photo-placeholder-for-social-networks-resumes-forums-and-dating-sites-male-and-female-no-photo-images-for-unfilled-user-profile-free-vector.jpg';

export function getProfilePictureUrl(profilePicture?: string | null): string {
    if (!profilePicture) {
        return DEFAULT_AVATAR_URL;
    }
    return getImageUrl(profilePicture);
}
