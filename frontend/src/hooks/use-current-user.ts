import { useContext, useEffect, useState, useMemo } from "react";
import AuthContext from "../components/auth/auth/AuthContext";
import type User from "../models/user";
import useService from "./use-service";
import ProfilePictureService from "../services/auth-aware/ProfilePictureService";
import { useAppSelector } from "../redux/hooks";
import useUserId from "./use-user-id";

export default function useCurrentUser() {
    const authContext = useContext(AuthContext);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const userId = useUserId();
    
    const contextUser = useMemo(() => authContext?.user ?? null, [authContext?.user]);

    const profilePictureService = useService(ProfilePictureService);

    // Sync profile picture from profile Redux when it was updated there (e.g. after upload on profile).
    // Following/followers lists never include the current user; feed may omit own posts — so we only read profile slice.
    const profilePosts = useAppSelector(state => state.profileSlice.posts);

    const currentUserProfilePicture = useMemo(() => {
        if (!userId) return null;
        const profilePost = profilePosts.find(p => p.user.id === userId);
        if (profilePost?.user.profilePicture !== undefined) {
            return profilePost.user.profilePicture;
        }
        return null;
    }, [userId, profilePosts]);

    useEffect(() => {
        if (!contextUser) {
            setUser(null);
            setIsLoading(false);
            return;
        }
        
        // Fetch full user profile (including profile picture)
        (async () => {
            try {
                setIsLoading(true);
                const fullUser = await profilePictureService.getCurrentUser();
                setUser(fullUser);
            } catch {
                // Fallback to session user if API call fails
                setUser(contextUser);
            } finally {
                setIsLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authContext?.user?.id]);

    // Update user profile picture if it changed in Redux state
    useEffect(() => {
        if (currentUserProfilePicture !== null) {
            setUser(prevUser => {
                if (prevUser && currentUserProfilePicture !== prevUser.profilePicture) {
                    return { ...prevUser, profilePicture: currentUserProfilePicture };
                }
                return prevUser;
            });
        }
    }, [currentUserProfilePicture]);

    return { user: user || contextUser, isLoading };
}
