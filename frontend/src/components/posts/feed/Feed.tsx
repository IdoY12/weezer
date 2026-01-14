import { useEffect, useState } from 'react';
import './Feed.css';
import Post from '../post/Post';
import Spinner from '../../common/spinner/Spinner';
import useTitle from '../../../hooks/use-title';
import { useAppDispatcher, useAppSelector } from '../../../redux/hooks';
import { init } from '../../../redux/feed-slice';
import SpinnerButton from '../../common/spinner-button/SpinnerButton';
import useService from '../../../hooks/use-service';
import FeedService from '../../../services/auth-aware/FeedService';

export default function Feed() {

    useTitle('Feed');

    const feedService = useService(FeedService);

    const feed = useAppSelector(state => state.feedSlice.posts);
    const isNewContentAvailable = useAppSelector(state => state.feedSlice.isNewContentAvailable);
    const dispatch = useAppDispatcher();
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(feed.length === 0);

    useEffect(() => {

        (async () => {
            try {
                if (feed.length === 0) {
                    setIsLoading(true);
                    const feedFromServer = await feedService.getFeed();
                    dispatch(init(feedFromServer));
                }
            } catch (e) {
                alert(e);
            } finally {
                setIsLoading(false);
            }
        })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch, feed.length]);


    async function refresh() {
        try {
            setIsRefreshing(true);
            const feedFromServer = await feedService.getFeed();
            dispatch(init(feedFromServer));
        } catch (e) {
            alert(e);
        } finally {
            setIsRefreshing(false);
        }
    }

    return (
        <div className='Feed'>
            {isLoading && <Spinner />}
            
            {!isLoading && feed.length > 0 && <>
                {isNewContentAvailable && <div className='info-box'>
                    you have new content available, please refresh <SpinnerButton
                        buttonText='refresh'
                        loadingText='refreshing'
                        onClick={refresh}
                        isSubmitting={isRefreshing}
                    />
                </div>}

                {feed.map(post => <Post
                    key={post.id}
                    post={post}
                    isEditAllowed={false}
                />)}
            </>}

            {!isLoading && feed.length === 0 && (
                <div className="empty-state">
                    <p>No posts yet. Follow some users to see their posts in your feed!</p>
                </div>
            )}
        </div>
    );
}