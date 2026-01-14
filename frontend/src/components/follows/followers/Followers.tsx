import { useEffect, useState } from 'react';
import './Followers.css';
import Follow from '../follow/Follow';
import Spinner from '../../common/spinner/Spinner';
import { useAppDispatcher, useAppSelector } from '../../../redux/hooks';
import { init } from '../../../redux/followers-slice';
import useService from '../../../hooks/use-service';
import FollowersService from '../../../services/auth-aware/FollowersService';

export default function Followers() {
    // const [followers, setFollowers] = useState<User[]>([])
    const followers = useAppSelector(store => store.followersSlice.followers);
    const dispatch = useAppDispatcher();
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const followersService = useService(FollowersService);
    useEffect(() => {
        (async () => {
            try {
                setIsLoading(true);
                const followers = await followersService.getFollowers();
                // setFollowers(followers)
                dispatch(init(followers));
            } catch (e) {
                alert(e);
            } finally {
                setIsLoading(false);
            }
        })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch]);

    return (
        <div className='Followers'>

            <h3>Followers</h3>
            
            {isLoading && <Spinner />}
            
            {!isLoading && followers.length > 0 && <>
                {followers.map(follow => <Follow
                    key={follow.id}
                    user={follow}
                />)}
            </>}

            {!isLoading && followers.length === 0 && (
                <div className="empty-state">
                    <p>No followers yet</p>
                </div>
            )}

        </div>
    );
}