import type PostCommentModel from '../../../../models/post-comment';
import './PostComment.css';
import ProfilePicture from '../../../common/profile-picture/ProfilePicture';

interface PostCommentProps {
    comment: PostCommentModel
}
export default function PostComment(props: PostCommentProps) {

    const { user, body, createdAt } = props.comment;
    const { name } = user;

    return (
        <div className='PostComment'>
            <div className="comment-author">
                <ProfilePicture user={user} size={24} />
                <h6>by {name} on {(new Date(createdAt)).toLocaleDateString()}</h6>
            </div>
            <div>{body}</div>
        </div>
    );
}