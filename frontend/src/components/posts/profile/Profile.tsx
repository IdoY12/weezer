import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './Profile.css';
import Post from '../post/Post';
import NewPost from '../new/NewPost';
import Spinner from '../../common/spinner/Spinner';
import useTitle from '../../../hooks/use-title';
import { useAppDispatcher, useAppSelector } from '../../../redux/hooks';
import { init, postAged } from '../../../redux/profile-slice';
import useService from '../../../hooks/use-service';
import ProfileService from '../../../services/auth-aware/ProfileService';
import useUserId from '../../../hooks/use-user-id';
import ProfilePictureService from '../../../services/auth-aware/ProfilePictureService';
import type User from '../../../models/user';
import FollowersService from '../../../services/auth-aware/FollowersService';
import FollowingService from '../../../services/auth-aware/FollowingService';
import FollowsModal from '../../follows/modal/FollowsModal';
import ProfilePicture from '../../common/profile-picture/ProfilePicture';
import { follow as followAction, unfollow as unfollowAction } from '../../../redux/following-slice';

export default function Profile() {
    const { userId: routeUserId } = useParams<"userId">();
    const currentUserId = useUserId();
    const viewedUserId = routeUserId ?? currentUserId ?? "";
    const viewedUserIdLower = String(viewedUserId).toLowerCase();
    const isOwnProfile = viewedUserIdLower === String(currentUserId ?? "").toLowerCase();
    const navigate = useNavigate();
    useTitle(isOwnProfile ? 'Profile' : 'User Profile');

    const profileService = useService(ProfileService);
    const profilePictureService = useService(ProfilePictureService);
    const followersService = useService(FollowersService);
    const followingService = useService(FollowingService);

    const newPost = useAppSelector(state => state.profileSlice.newPost);
    const profile = useAppSelector(state => state.profileSlice.posts);
    const followingFromStore = useAppSelector(state => state.followingSlice.following);
    const dispatch = useAppDispatcher();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isFollowSubmitting, setIsFollowSubmitting] = useState<boolean>(false);
    const [viewedUser, setViewedUser] = useState<User | null>(null);
    const [followersUsers, setFollowersUsers] = useState<User[]>([]);
    const [followingUsers, setFollowingUsers] = useState<User[]>([]);
    const [openModal, setOpenModal] = useState<"followers" | "following" | null>(null);
    const [externalProfilePosts, setExternalProfilePosts] = useState<typeof profile>([]);
    const amIFollowingViewedUser = !isOwnProfile && followingFromStore.some(
        user => String(user.id).toLowerCase() === viewedUserIdLower
    );

    const visibleProfilePosts = useMemo(
        () => (isOwnProfile ? profile : externalProfilePosts),
        [isOwnProfile, profile, externalProfilePosts]
    );

    useEffect(() => {
        (async () => {
            try {
                setIsLoading(true);
                const [targetUser, targetFollowers, targetFollowing] = await Promise.all([
                    profilePictureService.getUserById(viewedUserId),
                    followersService.getFollowersByUserId(viewedUserId),
                    followingService.getFollowingByUserId(viewedUserId)
                ]);

                setViewedUser(targetUser);
                setFollowersUsers(targetFollowers);
                setFollowingUsers(targetFollowing);

                if (isOwnProfile && profile.length === 0) {
                    const profileFromServer = await profileService.getProfile();
                    dispatch(init(profileFromServer));
                } else if (!isOwnProfile) {
                    const targetProfile = await profileService.getProfileByUserId(viewedUserId);
                    setExternalProfilePosts(targetProfile);
                }
            } catch (e) {
                alert(e);
            } finally {
                setIsLoading(false);
            }
        })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch, profile.length, isOwnProfile, viewedUserId]);

    useEffect(() => {
        setOpenModal(null);
    }, [viewedUserId]);

    useEffect(() => {
        function onFollowChanged(event: Event) {
            const customEvent = event as CustomEvent<{
                type: "follow" | "unfollow";
                follower?: User;
                followee?: User;
            }>;

            const follower = customEvent.detail?.follower;
            const followee = customEvent.detail?.followee;
            const eventType = customEvent.detail?.type;
            if (!follower || !followee || !eventType) return;

            const followerId = String(follower.id).toLowerCase();
            const followeeId = String(followee.id).toLowerCase();
            if (eventType === "follow") {
                if (followeeId === viewedUserIdLower) {
                    setFollowersUsers(prev => {
                        if (prev.some(user => String(user.id).toLowerCase() === followerId)) return prev;
                        return [follower, ...prev];
                    });
                }
                if (followerId === viewedUserIdLower) {
                    setFollowingUsers(prev => {
                        if (prev.some(user => String(user.id).toLowerCase() === followeeId)) return prev;
                        return [followee, ...prev];
                    });
                }
            } else {
                if (followeeId === viewedUserIdLower) {
                    setFollowersUsers(prev => prev.filter(user => String(user.id).toLowerCase() !== followerId));
                }
                if (followerId === viewedUserIdLower) {
                    setFollowingUsers(prev => prev.filter(user => String(user.id).toLowerCase() !== followeeId));
                }
            }
        }

        window.addEventListener("weezer-follow-change", onFollowChanged as EventListener);
        return () => window.removeEventListener("weezer-follow-change", onFollowChanged as EventListener);
    }, [viewedUserIdLower]);

    useEffect(() => {
        if (newPost && isOwnProfile) {
            setTimeout(() => {
                dispatch(postAged());
            }, 2000);
        }
    }, [dispatch, isOwnProfile, newPost]);

    function openChat() {
        if (!viewedUser) return;
        navigate(`/messages/new/${viewedUser.id}`);
    }

    async function followViewedUser() {
        if (!viewedUser) return;
        try {
            setIsFollowSubmitting(true);
            await followingService.follow(viewedUser.id);
            dispatch(followAction(viewedUser));
        } catch (e: any) {
            const message = String(e?.response?.data || e?.message || '').toLowerCase();
            if (message.includes('follow already exists')) {
                dispatch(followAction(viewedUser));
                return;
            }
            alert(e);
        } finally {
            setIsFollowSubmitting(false);
        }
    }

    async function unfollowViewedUser() {
        if (!viewedUser) return;
        try {
            setIsFollowSubmitting(true);
            await followingService.unfollow(viewedUser.id);
            dispatch(unfollowAction(viewedUser.id));
        } catch (e: any) {
            const message = String(e?.response?.data || e?.message || '').toLowerCase();
            if (message.includes('followee not found') || message.includes('follow does not exist')) {
                dispatch(unfollowAction(viewedUser.id));
                return;
            }
            alert(e);
        } finally {
            setIsFollowSubmitting(false);
        }
    }

    return (
        <div className='Profile'>
            {isLoading && <Spinner />}
            
            {!isLoading && <>
                <section className='profile-header'>
                    <div className='profile-banner' />
                    <div className='profile-header-content'>
                        {viewedUser && <ProfilePicture user={viewedUser} size={96} className='profile-avatar' />}
                        <div className='profile-identity'>
                            <h2>{viewedUser?.name ?? "User"}</h2>
                            {viewedUser?.username && <p>@{viewedUser.username}</p>}
                            <div className='profile-counts'>
                                <button type='button' onClick={() => setOpenModal("followers")}>
                                    <strong>{followersUsers.length}</strong> followers
                                </button>
                                <button type='button' onClick={() => setOpenModal("following")}>
                                    <strong>{followingUsers.length}</strong> following
                                </button>
                            </div>
                        </div>
                        {!isOwnProfile && (
                            <div className='profile-actions'>
                                {amIFollowingViewedUser ? (
                                    <button type='button' onClick={unfollowViewedUser} disabled={isFollowSubmitting}>
                                        {isFollowSubmitting ? "..." : "Unfollow"}
                                    </button>
                                ) : (
                                    <button type='button' onClick={followViewedUser} disabled={isFollowSubmitting}>
                                        {isFollowSubmitting ? "..." : "Follow"}
                                    </button>
                                )}
                                <button type='button' onClick={openChat}>Send Message</button>
                            </div>
                        )}
                    </div>
                </section>

                {isOwnProfile && <NewPost />}
                {isOwnProfile && newPost && <Post
                    key={newPost.id}
                    post={newPost}
                    isEditAllowed={true}
                    isNew={true}
                />}
                {visibleProfilePosts.map(post => <Post
                    key={post.id}
                    post={post}
                    isEditAllowed={isOwnProfile}
                />)}
                {visibleProfilePosts.length === 0 && (!isOwnProfile || !newPost) && (
                    <div className="empty-state">
                        <p>No posts yet.</p>
                    </div>
                )}

                <FollowsModal
                    isOpen={openModal === "followers"}
                    onClose={() => setOpenModal(null)}
                    title="Followers"
                    users={followersUsers}
                />
                <FollowsModal
                    isOpen={openModal === "following"}
                    onClose={() => setOpenModal(null)}
                    title="Following"
                    users={followingUsers}
                />
            </>}
        </div>
    );
}