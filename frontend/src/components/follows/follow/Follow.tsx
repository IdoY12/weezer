import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type User from '../../../models/user';
import SpinnerButton from '../../common/spinner-button/SpinnerButton';
import './Follow.css';
import { useAppDispatcher, useAppSelector } from '../../../redux/hooks';
import { follow, unfollow } from '../../../redux/following-slice';
import useService from '../../../hooks/use-service';
import FollowingService from '../../../services/auth-aware/FollowingService';
import ProfilePicture from '../../common/profile-picture/ProfilePicture';

interface FollowProps {
    user: User
    showMessageButton?: boolean
    onNavigateToProfile?(): void
}
export default function Follow(props: FollowProps) {

    const { user, showMessageButton = true, onNavigateToProfile } = props;

    const { id, name, username } = user;
    const targetUserId = String(id).toLowerCase();

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const amIFollowing = useAppSelector(
        store => store.followingSlice.following.findIndex(f => String(f.id).toLowerCase() === targetUserId) > -1
    );

    const dispatch = useAppDispatcher();
    const navigate = useNavigate();

    const followingService = useService(FollowingService);

    function getErrorMessage(error: unknown): string {
        if (!error || typeof error !== "object") return "";
        const maybeError = error as { response?: { data?: unknown }, message?: string };
        const responseData = maybeError.response?.data;
        if (typeof responseData === "string") return responseData.toLowerCase();
        if (typeof maybeError.message === "string") return maybeError.message.toLowerCase();
        return "";
    }

    async function unfollowMe() {
        try {
            setIsSubmitting(true);
            await followingService.unfollow(id);
            dispatch(unfollow(id));
        } catch (e: unknown) {
            const message = getErrorMessage(e);
            // Defensive sync: server says no follow exists -> local UI must show "follow".
            if (message.includes('followee not found') || message.includes('follow does not exist')) {
                dispatch(unfollow(id));
                return;
            }
            alert(e);
        } finally {
            setIsSubmitting(false);
        }
    }

    async function followMe() {
        try {
            setIsSubmitting(true);
            await followingService.follow(id);
            dispatch(follow(user));
        } catch (e: unknown) {
            const message = getErrorMessage(e);
            // Defensive sync: server says follow exists -> local UI must show "unfollow".
            if (message.includes('follow already exists')) {
                dispatch(follow(user));
                return;
            }
            alert(e);
        } finally {
            setIsSubmitting(false);
        }
    }

    function openChat() {
        navigate(`/messages/new/${id}`);
    }

    function openProfile() {
        onNavigateToProfile?.();
        navigate(`/profile/${id}`);
    }

    return (
        <div className='Follow'>
            <ProfilePicture user={user} size={50} />
            <button onClick={openProfile}>
                {name} <span>@{username}</span>
            </button>
            <div>
                {amIFollowing && <SpinnerButton
                    onClick={unfollowMe}
                    buttonText='unfollow'
                    loadingText='unfollowing'
                    isSubmitting={isSubmitting}
                />}

                {!amIFollowing && <SpinnerButton
                    onClick={followMe}
                    buttonText='follow'
                    loadingText='following'
                    isSubmitting={isSubmitting}
                />}

            </div>
            {showMessageButton && (
                <div>
                    <button onClick={openChat}>message</button>
                </div>
            )}
        </div>
    );
}