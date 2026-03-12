import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type Post from "../models/post";
import type PostComment from "../models/post-comment";

interface FeedState {
    posts: Post[],
    pendingPosts: Post[],
    isNewContentAvailable: boolean
}

const initialState: FeedState = {
    posts: [],
    pendingPosts: [],
    isNewContentAvailable: false
};

export const feedSlice = createSlice({
    name: 'feed',
    initialState,
    reducers: {
        init: (state, action: PayloadAction<Post[]>) => {
            state.posts = action.payload;
            state.pendingPosts = [];
            state.isNewContentAvailable = false;
        },
        newComment: (state, action: PayloadAction<PostComment>) => {
            const post = state.posts.find(p => p.id === action.payload.postId);
            post?.comments.push(action.payload);
        },
        indicateNewContentAvailable: (state, action: PayloadAction<Post>) => {
            const post = action.payload;
            const postId = String(post.id).toLowerCase();
            const visibleExists = state.posts.some(existing => String(existing.id).toLowerCase() === postId);
            const pendingExists = state.pendingPosts.some(existing => String(existing.id).toLowerCase() === postId);
            if (!visibleExists && !pendingExists) {
                state.pendingPosts = [post, ...state.pendingPosts];
                state.isNewContentAvailable = true;
            }
        },
        applyPendingPosts: (state) => {
            const existingIds = new Set(state.posts.map(post => String(post.id).toLowerCase()));
            const freshPending = state.pendingPosts.filter(post => !existingIds.has(String(post.id).toLowerCase()));
            state.posts = [...freshPending, ...state.posts];
            state.pendingPosts = [];
            state.isNewContentAvailable = false;
        },
        dismissPendingPosts: (state) => {
            state.pendingPosts = [];
            state.isNewContentAvailable = false;
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

export const { init, newComment, indicateNewContentAvailable, applyPendingPosts, dismissPendingPosts, updateUserProfilePicture } = feedSlice.actions;

export default feedSlice.reducer;