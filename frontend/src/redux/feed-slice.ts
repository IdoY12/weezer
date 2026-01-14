import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type Post from "../models/post";
import type PostComment from "../models/post-comment";

interface FeedState {
    posts: Post[],
    isNewContentAvailable: boolean
}

const initialState: FeedState = {
    posts: [],
    isNewContentAvailable: false
};

export const feedSlice = createSlice({
    name: 'feed',
    initialState,
    reducers: {
        init: (state, action: PayloadAction<Post[]>) => {
            state.posts = action.payload;
            state.isNewContentAvailable = false;
        },
        newComment: (state, action: PayloadAction<PostComment>) => {
            const post = state.posts.find(p => p.id === action.payload.postId);
            post?.comments.push(action.payload);
        },
        indicateNewContentAvailable: (state) => {
            state.isNewContentAvailable = true;
        },
        newPost: (state, action: PayloadAction<Post>) => {
            // Add new post to feed if it's from a followed user
            // Check if post already exists (avoid duplicates)
            const postExists = state.posts.find(p => p.id === action.payload.id);
            if (!postExists) {
                // Add to beginning of feed (newest first)
                state.posts = [action.payload, ...state.posts];
                state.isNewContentAvailable = false;
            }
        },
        updateUserProfilePicture: (state, action: PayloadAction<{ userId: string, profilePicture: string | null }>) => {
            // Update post authors
            state.posts.forEach(post => {
                if (post.user.id === action.payload.userId) {
                    post.user.profilePicture = action.payload.profilePicture;
                }
            });
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

export const { init, newComment, indicateNewContentAvailable, updateUserProfilePicture, newPost } = feedSlice.actions;

export default feedSlice.reducer;