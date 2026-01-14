import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type Post from "../models/post";
import type PostComment from "../models/post-comment";



interface ProfileState {
    newPost?: Post
    posts: Post[]
}

const initialState: ProfileState = {
    newPost: undefined,
    posts: []
};

export const profileSlice = createSlice({
    name: 'profile',
    initialState,
    reducers: {
        init: (state, action: PayloadAction<Post[]>) => {
            state.posts = action.payload;
        },
        newPost: (state, action: PayloadAction<Post>) => {
            // state.posts = [action.payload, ...state.posts]
            state.newPost = action.payload;
        },
        updatePost: (state, action: PayloadAction<Post>) => {
            const idx = state.posts.findIndex(p => p.id === action.payload.id);
            if (idx > -1) state.posts[idx] = action.payload;
        },
        newComment: (state, action: PayloadAction<PostComment>) => {
            const post = state.posts.find(p => p.id === action.payload.postId);
            post?.comments.push(action.payload);
        },
        deletePost: (state, action: PayloadAction<string>) => {
            state.posts = state.posts.filter(p => p.id !== action.payload);
        },
        postAged: (state) => {
            if (state.newPost) {
                state.posts = [state.newPost, ...state.posts];
                state.newPost = undefined;
            }
        },
        updateUserProfilePicture: (state, action: PayloadAction<{ userId: string, profilePicture: string | null }>) => {
            // Update post authors
            state.posts.forEach(post => {
                if (post.user.id === action.payload.userId) {
                    post.user.profilePicture = action.payload.profilePicture;
                }
            });
            // Update newPost author if applicable
            if (state.newPost && state.newPost.user.id === action.payload.userId) {
                state.newPost.user.profilePicture = action.payload.profilePicture;
            }
            // Update comment authors
            state.posts.forEach(post => {
                post.comments.forEach(comment => {
                    if (comment.user.id === action.payload.userId) {
                        comment.user.profilePicture = action.payload.profilePicture;
                    }
                });
            });
        }
    }
});

export const { init, newPost, updatePost, newComment, deletePost, postAged, updateUserProfilePicture } = profileSlice.actions;

export default profileSlice.reducer;