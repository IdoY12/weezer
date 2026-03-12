import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type User from "../models/user";

interface FollowingState {
    following: User[]
}

const initialState: FollowingState = {
    following: []
};

export const followingSlice = createSlice({
    name: 'following',
    initialState,
    reducers: {
        init: (state, action: PayloadAction<User[]>) => {
            const dedupedById = new Map<string, User>();
            action.payload.forEach(user => {
                dedupedById.set(String(user.id).toLowerCase(), user);
            });
            state.following = [...dedupedById.values()];
        },
        follow: (state, action: PayloadAction<User>) => {
            const targetId = String(action.payload.id).toLowerCase();
            const existingIndex = state.following.findIndex(f => String(f.id).toLowerCase() === targetId);
            if (existingIndex === -1) {
                state.following.push(action.payload);
            } else {
                state.following[existingIndex] = action.payload;
            }
        },
        unfollow: (state, action: PayloadAction<string>) => {
            const targetId = String(action.payload).toLowerCase();
            state.following = state.following.filter(f => String(f.id).toLowerCase() !== targetId);
        },
        updateUserProfilePicture: (state, action: PayloadAction<{ userId: string, profilePicture: string | null }>) => {
            const following = state.following.find(f => f.id === action.payload.userId);
            if (following) {
                following.profilePicture = action.payload.profilePicture;
            }
        }
    }
});

export const { init, follow, unfollow, updateUserProfilePicture } = followingSlice.actions;

export default followingSlice.reducer;