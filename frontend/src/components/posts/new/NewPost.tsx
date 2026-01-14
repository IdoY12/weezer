import { useForm } from 'react-hook-form';
import type PostDraft from '../../../models/post-draft';
import './NewPost.css';
import SpinnerButton from '../../common/spinner-button/SpinnerButton';
import { useState } from 'react';
import { useAppDispatcher } from '../../../redux/hooks';
import { newPost } from '../../../redux/profile-slice';
import useService from '../../../hooks/use-service';
import ProfileService from '../../../services/auth-aware/ProfileService';

export default function NewPost() {

    const { register, handleSubmit, reset, formState } = useForm<PostDraft>();

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [preview, setPreview] = useState<string | null>(null);

    const dispatch = useAppDispatcher();

    const profileService = useService(ProfileService);

    async function submit(draft: PostDraft) {
        draft.image = (draft.image as unknown as FileList)[0];

        try {
            setIsSubmitting(true);
            const post = await profileService.newPost(draft);
            reset();
            setPreview(null);
            dispatch(newPost(post));
        } catch (e) {
            alert(e);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className='NewPost'>
            <form onSubmit={handleSubmit(submit)}>
                <input placeholder="add title" {...register('title', {
                    required: {
                        value: true,
                        message: 'Title is required'
                    },
                    minLength: {
                        value: 10,
                        message: 'Title must be at least 10 characters long'
                    },
                    maxLength: {
                        value: 40,
                        message: 'Title must be at most 40 characters long'
                    }
                })} />
                <div className='formError'>{formState.errors.title?.message}</div>

                <textarea placeholder='add content' {...register('body', {
                    required: {
                        value: true,
                        message: 'Post content is required'
                    },
                    minLength: {
                        value: 20,
                        message: 'Post content must be at least 20 characters long'
                    }
                })}></textarea>
                <div className='formError'>{formState.errors.body?.message}</div>

                <input 
                    type="file" 
                    {...register('image', {
                        required: {
                            value: true,
                            message: 'Image is required'
                        },
                        validate: (value) => {
                            const fileList = value as unknown as FileList;
                            const file = fileList?.[0];
                            if (!file) return 'Image is required';
                            const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
                            if (!validTypes.includes(file.type)) {
                                return 'Image must be JPEG, PNG or WebP format';
                            }
                            return true;
                        }
                    })}
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            setPreview(URL.createObjectURL(file));
                        }
                    }}
                />
                <div className='formError'>{formState.errors.image?.message}</div>

                {preview && (
                    <div style={{ marginTop: "12px", borderRadius: "12px", overflow: "hidden", border: "1px solid #e5e7eb" }}>
                        <img src={preview} style={{ width: "100%", height: "240px", objectFit: "cover" }} />
                    </div>
                )}

                <SpinnerButton
                    buttonText='Add Post'
                    loadingText='adding post'
                    isSubmitting={isSubmitting}
                />
            </form>
        </div>
    );
}