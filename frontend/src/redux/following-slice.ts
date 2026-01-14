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
            state.following = action.payload;
        },
        follow: (state, action: PayloadAction<User>) => {
            // Prevent duplicates - check if already following
            const existingIndex = state.following.findIndex(f => f.id === action.payload.id);
            if (existingIndex === -1) {
                state.following.push(action.payload);
            } else {
                // Update existing (in case profile changed)
                state.following[existingIndex] = action.payload;
            }
        },
        unfollow: (state, action: PayloadAction<string>) => {
            state.following = state.following.filter(f => f.id !== action.payload);
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