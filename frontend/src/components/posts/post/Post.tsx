import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type PostModel from '../../../models/post';
import './Post.css';
import PostComments from '../comments/post-comments/PostComments';
import { useAppDispatcher } from '../../../redux/hooks';
import { deletePost } from '../../../redux/profile-slice';
import useService from '../../../hooks/use-service';
import ProfileService from '../../../services/auth-aware/ProfileService';
import getImageUrl from '../../../hooks/use-image';
import ProfilePicture from '../../common/profile-picture/ProfilePicture';
import Modal from '../../common/modal/Modal';

interface PostProps {
    post: PostModel,
    isEditAllowed: boolean,
    isNew?: boolean
}

export default function Post(props: PostProps) {

    const {
        title,
        createdAt,
        user,
        body,
        id,
        imageUrl,
        comments
    } = props.post;

    const { name } = user;

    const { isEditAllowed, isNew } = props;

    const navigate = useNavigate();

    const dispatch = useAppDispatcher();

    const profileService = useService(ProfileService);

    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const handleDeleteClick = () => {
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            await profileService.remove(id);
            dispatch(deletePost(id));
            setShowDeleteModal(false);
        } catch (e) {
            alert(e);
            setShowDeleteModal(false);
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
    };

    function editMe() {
        navigate(`/profile/edit/${id}`);
    }

    const image = imageUrl ? getImageUrl(imageUrl) : '';

    const className = `Post ${isNew ? 'new-post' : ''}`;

    return (
        <div className={className}>
            <div><h3>{title}</h3></div>
            <div className="post-author">
                <ProfilePicture user={user} size={32} />
                <span>{(new Date(createdAt)).toLocaleDateString()} by {name}</span>
            </div>
            <div>{body}</div>
            {image && <div><img src={`${image}`} /></div>}
            {/* conditional rendering (render something depending on a boolean value):  */}
            {isEditAllowed && <div>
                <button onClick={handleDeleteClick}>Delete</button><button onClick={editMe}>Edit</button>
            </div>}

            <PostComments
                comments={comments}
                postId={id}
            />

            <Modal
                isOpen={showDeleteModal}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                title="Delete Post"
                message="Are you sure you want to delete this post? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
            />

        </div>
    );
}