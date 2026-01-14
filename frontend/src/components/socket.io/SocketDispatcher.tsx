import { useEffect, useState, useRef, type PropsWithChildren } from "react";
import { io } from "socket.io-client";
import { v4 } from "uuid";
import { useAppDispatcher, useAppSelector } from "../../redux/hooks";
import useUserId from "../../hooks/use-user-id";
import SocketDispatcherContext from "./SocketDispatcherContext";
import { newPost as profileNewPost, newComment as profileNewComment, updateUserProfilePicture as profileUpdateUserProfilePicture } from "../../redux/profile-slice";
import { newPost as feedNewPost, newComment as feedNewComment, indicateNewContentAvailable, updateUserProfilePicture as feedUpdateUserProfilePicture } from "../../redux/feed-slice";
import { newFollower, followerRemoved, updateUserProfilePicture as followersUpdateUserProfilePicture } from "../../redux/followers-slice";
import { follow, unfollow, updateUserProfilePicture as followingUpdateUserProfilePicture } from "../../redux/following-slice";

export default function SocketDispatcher(props: PropsWithChildren) {
    const dispatch = useAppDispatcher();
    const userId = useUserId();
    const following = useAppSelector(state => state.followingSlice.following);
    const [clientId] = useState<string>(v4());
    
    // Use ref to store latest following state for use in event handlers
    const followingRef = useRef(following);
    useEffect(() => {
        followingRef.current = following;
    }, [following]);

    useEffect(() => {
        const socketUrl = import.meta.env.VITE_IO_SERVER_URL;
        console.log(`🔌 Frontend connecting to Socket.io server at: ${socketUrl}`);
        console.log(`🆔 Client ID: ${clientId}`);

        const socket = io(socketUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });

        socket.on('connect', () => {
            console.log('✅ Frontend socket connected to IO server!');
            console.log(`   Socket ID: ${socket.id}`);
        });

        socket.on('connect_error', (error) => {
            console.error('❌ Frontend socket connection error:', error.message);
        });

        socket.on('disconnect', (reason) => {
            console.log(`⚠️ Frontend socket disconnected: ${reason}`);
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        socket.on('NewPost', (payload: any) => {
            console.log(`📥 Frontend received NewPost:`, payload);
            
            if (payload.from === clientId) {
                console.log(`   ⏭️ Skipping event from same client (${clientId})`);
                return;
            }

            // If post is from current user, add to profile
            if (payload.post.userId === userId) {
                console.log(`   ✅ Adding post to profile (current user's post)`);
                dispatch(profileNewPost(payload.post));
            }
            
            // Add post to feed if user is following the poster
            // Use ref to get fresh following state
            const currentFollowing = followingRef.current;
            const isFollowingPoster = currentFollowing.some(f => f.id === payload.post.userId || f.id === payload.post.user?.id);
            if (isFollowingPoster && payload.post.userId !== userId) {
                console.log(`   ✅ Adding post to feed (user follows poster)`);
                dispatch(feedNewPost(payload.post));
                dispatch(indicateNewContentAvailable());
            }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        socket.on('NewFollow', (payload: any) => {
            console.log(`📥 Frontend received NewFollow:`, payload);
            console.log(`   Current userId: ${userId} (type: ${typeof userId})`);
            console.log(`   Payload from (clientId): ${payload.from}`);
            console.log(`   Local clientId: ${clientId}`);
            console.log(`   Followee ID: ${payload.followee?.id} (type: ${typeof payload.followee?.id})`);
            console.log(`   Follower ID: ${payload.follower?.id} (type: ${typeof payload.follower?.id})`);
            console.log(`   Followee object:`, payload.followee);
            console.log(`   Follower object:`, payload.follower);
            
            if (!userId) {
                console.log(`   ⚠️ No userId - user not logged in, skipping`);
                return;
            }
            
            // Skip events from same client (to avoid duplicate updates from optimistic updates)
            if (payload.from === clientId) {
                console.log(`   ⏭️ Skipping event from same client (${clientId}) - already updated optimistically`);
                return;
            }
            
            // TEMPORARY DEBUG: To test if clientId check is blocking legitimate events, 
            // comment out the above if block temporarily

            // Ensure string comparison
            const followeeId = String(payload.followee?.id || '');
            const followerId = String(payload.follower?.id || '');
            const currentUserId = String(userId);

            console.log(`   🔍 Comparing IDs:`);
            console.log(`      currentUserId (${currentUserId}) === followeeId (${followeeId}): ${currentUserId === followeeId}`);
            console.log(`      currentUserId (${currentUserId}) === followerId (${followerId}): ${currentUserId === followerId}`);

            if (currentUserId === followeeId) {
                console.log(`   ✅ I am the followee - dispatching newFollower action with:`, payload.follower);
                dispatch(newFollower(payload.follower));
                console.log(`   ✅ newFollower action dispatched!`);
            }
            if (currentUserId === followerId) {
                console.log(`   ✅ I am the follower - dispatching follow action with:`, payload.followee);
                dispatch(follow(payload.followee));
                console.log(`   ✅ follow action dispatched!`);
            }
            
            if (currentUserId !== followeeId && currentUserId !== followerId) {
                console.log(`   ⚠️ This event is not for me - I'm neither the follower nor the followee`);
                console.log(`   ⚠️ Current user ID: ${currentUserId}`);
                console.log(`   ⚠️ Followee ID: ${followeeId}`);
                console.log(`   ⚠️ Follower ID: ${followerId}`);
            }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        socket.on('NewUnfollow', (payload: any) => {
            console.log(`📥 Frontend received NewUnfollow:`, payload);
            console.log(`   Current userId: ${userId} (type: ${typeof userId})`);
            console.log(`   Payload from (clientId): ${payload.from}`);
            console.log(`   Local clientId: ${clientId}`);
            console.log(`   Followee ID: ${payload.followee?.id} (type: ${typeof payload.followee?.id})`);
            console.log(`   Follower ID: ${payload.follower?.id} (type: ${typeof payload.follower?.id})`);
            
            if (!userId) {
                console.log(`   ⚠️ No userId - user not logged in, skipping`);
                return;
            }
            
            // Skip events from same client (to avoid duplicate updates from optimistic updates)
            if (payload.from === clientId) {
                console.log(`   ⏭️ Skipping event from same client (${clientId}) - already updated optimistically`);
                return;
            }
            
            // TEMPORARY DEBUG: To test if clientId check is blocking legitimate events, 
            // comment out the above if block temporarily

            // Ensure string comparison
            const followeeId = String(payload.followee?.id || '');
            const followerId = String(payload.follower?.id || '');
            const currentUserId = String(userId);

            console.log(`   🔍 Comparing IDs:`);
            console.log(`      currentUserId (${currentUserId}) === followeeId (${followeeId}): ${currentUserId === followeeId}`);
            console.log(`      currentUserId (${currentUserId}) === followerId (${followerId}): ${currentUserId === followerId}`);

            if (currentUserId === followeeId) {
                console.log(`   ✅ I am the followee - dispatching followerRemoved action with ID:`, payload.follower.id);
                dispatch(followerRemoved(payload.follower.id));
                console.log(`   ✅ followerRemoved action dispatched!`);
            }
            if (currentUserId === followerId) {
                console.log(`   ✅ I am the follower - dispatching unfollow action with ID:`, payload.followee.id);
                dispatch(unfollow(payload.followee.id));
                console.log(`   ✅ unfollow action dispatched!`);
            }
            
            if (currentUserId !== followeeId && currentUserId !== followerId) {
                console.log(`   ⚠️ This event is not for me - I'm neither the follower nor the followee`);
                console.log(`   ⚠️ Current user ID: ${currentUserId}`);
                console.log(`   ⚠️ Followee ID: ${followeeId}`);
                console.log(`   ⚠️ Follower ID: ${followerId}`);
            }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        socket.on('NewComment', (payload: any) => {
            console.log(`📥 Frontend received NewComment:`, payload);
            
            if (payload.from === clientId) {
                console.log(`   ⏭️ Skipping event from same client (${clientId})`);
                return;
            }

            console.log(`   ✅ Adding comment to profile and feed`);
            dispatch(profileNewComment(payload.newComment));
            dispatch(feedNewComment(payload.newComment));
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        socket.on('user:profile-picture-updated', (payload: any) => {
            console.log(`📥 Frontend received user:profile-picture-updated:`, payload);
            
            if (payload.from === clientId) {
                console.log(`   ⏭️ Skipping event from same client (${clientId})`);
                return;
            }

            console.log(`   ✅ Updating profile picture across all slices`);
            const updatePayload = { userId: payload.userId, profilePicture: payload.profilePicture };
            dispatch(profileUpdateUserProfilePicture(updatePayload));
            dispatch(feedUpdateUserProfilePicture(updatePayload));
            dispatch(followersUpdateUserProfilePicture(updatePayload));
            dispatch(followingUpdateUserProfilePicture(updatePayload));
        });

        return () => {
            console.log('🔌 Frontend socket disconnecting...');
            socket.disconnect();
        };
    }, [dispatch, userId, clientId]); // CRITICAL: Removed 'following' from deps to prevent reconnections

    const { children } = props;

    return (
        <SocketDispatcherContext.Provider value={{ clientId }}>
            {children}
        </SocketDispatcherContext.Provider>
    );
}