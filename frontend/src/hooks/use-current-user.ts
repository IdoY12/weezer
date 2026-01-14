import { useContext, useEffect, useState, useMemo } from "react";
import AuthContext from "../components/auth/auth/AuthContext";
import { jwtDecode } from "jwt-decode";
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
    
    // Get basic user info from JWT first (synchronous)
    const jwtUser = useMemo(() => {
        if (!authContext?.jwt) return null;
        try {
            return jwtDecode<User>(authContext.jwt);
        } catch {
            return null;
        }
    }, [authContext?.jwt]);

    const profilePictureService = useService(ProfilePictureService);

    // Monitor Redux state for profile picture updates for the current user
    // Check profile slice first (user's own posts), then feed, then followers/following
    const profilePosts = useAppSelector(state => state.profileSlice.posts);
    const feedPosts = useAppSelector(state => state.feedSlice.posts);
    const following = useAppSelector(state => state.followingSlice.following);
    const followers = useAppSelector(state => state.followersSlice.followers);

    // Find current user's profile picture in Redux state (check all slices)
    const currentUserProfilePicture = useMemo(() => {
        if (!userId) return null;
        // Check profile posts first (most likely to exist)
        const profilePost = profilePosts.find(p => p.user.id === userId);
        if (profilePost?.user.profilePicture !== undefined) {
            return profilePost.user.profilePicture;
        }
        // Check feed posts
        const feedPost = feedPosts.find(p => p.user.id === userId);
        if (feedPost?.user.profilePicture !== undefined) {
            return feedPost.user.profilePicture;
        }
        // Check following
        const followingUser = following.find(u => u.id === userId);
        if (followingUser?.profilePicture !== undefined) {
            return followingUser.profilePicture;
        }
        // Check followers
        const follower = followers.find(u => u.id === userId);
        if (follower?.profilePicture !== undefined) {
            return follower.profilePicture;
        }
        return null;
    }, [userId, profilePosts, feedPosts, following, followers]);

    useEffect(() => {
        if (!authContext?.jwt || !jwtUser) {
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
                // Fallback to JWT data if API call fails
                setUser(jwtUser);
            } finally {
                setIsLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authContext?.jwt]);

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

    return { user: user || jwtUser, isLoading };
}
