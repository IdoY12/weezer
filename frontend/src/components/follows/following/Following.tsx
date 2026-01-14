import { useEffect } from 'react';
import './Following.css';
import Follow from '../follow/Follow';
import { useAppDispatcher, useAppSelector } from '../../../redux/hooks';
import { init } from '../../../redux/following-slice';
import useService from '../../../hooks/use-service';
import FollowingService from '../../../services/auth-aware/FollowingService';

export default function Following() {

    const following = useAppSelector(store => store.followingSlice.following);
    const dispatch = useAppDispatcher();

    const followingService = useService(FollowingService);
    useEffect(() => {

        (async () => {
            try {
                const followingFromServer = await followingService.getFollowing();
                dispatch(init(followingFromServer));
            } catch (e) {
                alert(e);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch]);

    return (
        <div className='Following'>
            <h3>Following</h3>
            {following.length > 0 && <>
                {following.map(follow => <Follow
                    key={follow.id}
                    user={follow}
                />)}
            </>}

            {following.length === 0 && (
                <div className="empty-state">
                    <p>You're not following anyone yet. Search for users to follow!</p>
                </div>
            )}
        </div>
    );
}