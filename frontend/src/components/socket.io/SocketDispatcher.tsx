import { useContext, useEffect, useState, useRef, type PropsWithChildren } from "react";
import { io } from "socket.io-client";
import { v4 } from "uuid";
import SocketMessages from "socket-enums-idoyahav";
import { useAppDispatcher, useAppSelector } from "../../redux/hooks";
import useUserId from "../../hooks/use-user-id";
import SocketDispatcherContext from "./SocketDispatcherContext";
import { newPost as profileNewPost, newComment as profileNewComment, updateUserProfilePicture as profileUpdateUserProfilePicture } from "../../redux/profile-slice";
import { newComment as feedNewComment, indicateNewContentAvailable, updateUserProfilePicture as feedUpdateUserProfilePicture } from "../../redux/feed-slice";
import { init as initFollowers, newFollower, followerRemoved, updateUserProfilePicture as followersUpdateUserProfilePicture } from "../../redux/followers-slice";
import { init as initFollowing, follow, unfollow, updateUserProfilePicture as followingUpdateUserProfilePicture } from "../../redux/following-slice";
import { setConversations, setUnreadCount, upsertMessage } from "../../redux/messages-slice";
import MessagesService from "../../services/auth-aware/MessagesService";
import AuthContext from "../auth/auth/AuthContext";
import FollowingService from "../../services/auth-aware/FollowingService";
import FollowersService from "../../services/auth-aware/FollowersService";

export default function SocketDispatcher(props: PropsWithChildren) {
    const dispatch = useAppDispatcher();
    const userId = useUserId();
    const following = useAppSelector(state => state.followingSlice.following);
    const [clientId] = useState<string>(v4());
    const authContext = useContext(AuthContext);
    
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
            reconnectionAttempts: 5,
            auth: {
                userId
            }
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
        socket.on(SocketMessages.NewPost, (payload: any) => {
            console.log(`📥 Frontend received NewPost:`, payload);

            if (payload?.entityType === "conversation-list-sync") {
                const nextConversations = payload?.conversationsByUserId?.[String(userId)] ?? [];
                dispatch(setConversations(nextConversations));
                return;
            }
            if (payload?.entityType === "unread-count-sync") {
                const unreadCount = payload?.unreadCountByUserId?.[String(userId)] ?? 0;
                dispatch(setUnreadCount(unreadCount));
                return;
            }
            if (payload?.entityType === "profile-picture-sync") {
                const updatePayload = { userId: payload.userId, profilePicture: payload.profilePicture };
                dispatch(profileUpdateUserProfilePicture(updatePayload));
                dispatch(feedUpdateUserProfilePicture(updatePayload));
                dispatch(followersUpdateUserProfilePicture(updatePayload));
                dispatch(followingUpdateUserProfilePicture(updatePayload));
                return;
            }
            
            if (payload.from === clientId) {
                console.log(`   ⏭️ Skipping event from same client (${clientId})`);
                return;
            }

            const payloadPostUserId = String(payload?.post?.userId ?? payload?.post?.user?.id ?? '').toLowerCase();
            const currentUserId = String(userId ?? '').toLowerCase();

            // If post is from current user, add to profile
            if (payloadPostUserId && payloadPostUserId === currentUserId) {
                console.log(`   ✅ Adding post to profile (current user's post)`);
                dispatch(profileNewPost(payload.post));
                return;
            }
            
            const currentFollowing = followingRef.current;
            const isFollowingPoster = currentFollowing.some(f => String(f.id).toLowerCase() === payloadPostUserId);
            if (isFollowingPoster && payloadPostUserId && payloadPostUserId !== currentUserId) {
                console.log(`   ✅ Queueing new post as pending content`);
                dispatch(indicateNewContentAvailable(payload.post));
            }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        socket.on(SocketMessages.NewFollow, (payload: any) => {
            console.log(`📥 Frontend received NewFollow:`, payload);
            
            if (!userId) {
                return;
            }

            window.dispatchEvent(new CustomEvent("weezer-follow-change", {
                detail: {
                    type: "follow",
                    follower: payload?.follower,
                    followee: payload?.followee
                }
            }));
            
            // Skip events from same client (to avoid duplicate updates from optimistic updates)
            if (payload.from === clientId) {
                return;
            }

            // Ensure string comparison
            const followeeId = String(payload.followee?.id || '').toLowerCase();
            const followerId = String(payload.follower?.id || '').toLowerCase();
            const currentUserId = String(userId).toLowerCase();

            if (currentUserId === followeeId) {
                dispatch(newFollower(payload.follower));
            }
            if (currentUserId === followerId) {
                dispatch(follow(payload.followee));
            }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        socket.on(SocketMessages.NewUnfollow, (payload: any) => {
            console.log(`📥 Frontend received NewUnfollow:`, payload);
            
            if (!userId) {
                return;
            }

            window.dispatchEvent(new CustomEvent("weezer-follow-change", {
                detail: {
                    type: "unfollow",
                    follower: payload?.follower,
                    followee: payload?.followee
                }
            }));
            
            // Skip events from same client (to avoid duplicate updates from optimistic updates)
            if (payload.from === clientId) {
                return;
            }

            // Ensure string comparison
            const followeeId = String(payload.followee?.id || '').toLowerCase();
            const followerId = String(payload.follower?.id || '').toLowerCase();
            const currentUserId = String(userId).toLowerCase();

            if (currentUserId === followeeId) {
                dispatch(followerRemoved(payload.follower.id));
            }
            if (currentUserId === followerId) {
                dispatch(unfollow(payload.followee.id));
            }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        socket.on(SocketMessages.NewComment, (payload: any) => {
            console.log(`📥 Frontend received NewComment:`, payload);

            if (payload?.entityType === "chat-message") {
                dispatch(upsertMessage(payload.message));
                return;
            }
            
            if (payload.from === clientId) {
                console.log(`   ⏭️ Skipping event from same client (${clientId})`);
                return;
            }

            console.log(`   ✅ Adding comment to profile and feed`);
            dispatch(profileNewComment(payload.newComment));
            dispatch(feedNewComment(payload.newComment));
        });

        return () => {
            console.log('🔌 Frontend socket disconnecting...');
            socket.disconnect();
        };
    }, [dispatch, userId, clientId]); // CRITICAL: Removed 'following' from deps to prevent reconnections

    useEffect(() => {
        (async () => {
            if (!userId) return;
            const jwt = authContext?.jwt ?? "";
            const messagesService = new MessagesService(jwt, clientId);
            const followingService = new FollowingService(jwt, clientId);
            const followersService = new FollowersService(jwt, clientId);

            try {
                const conversations = await messagesService.getConversations();
                dispatch(setConversations(conversations));
            } catch {
                dispatch(setUnreadCount(0));
            }

            try {
                const [followingFromServer, followersFromServer] = await Promise.all([
                    followingService.getFollowing(),
                    followersService.getFollowers()
                ]);
                dispatch(initFollowing(followingFromServer));
                dispatch(initFollowers(followersFromServer));
            } catch {
                dispatch(initFollowing([]));
            }
        })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch, userId, clientId, authContext?.jwt]);

    const { children } = props;

    return (
        <SocketDispatcherContext.Provider value={{ clientId }}>
            {children}
        </SocketDispatcherContext.Provider>
    );
}