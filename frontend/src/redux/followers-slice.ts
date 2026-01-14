import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type User from "../models/user";

interface FollowersState {
    followers: User[],
    isActive: boolean
}

const initialState: FollowersState = {
    followers: [],
    isActive: true
};

export const followersSlice = createSlice({
    name: 'followers',
    initialState,
    reducers: {
        init: (state, action: PayloadAction<User[]>) => {
            state.followers = action.payload;
        },
        newFollower: (state, action: PayloadAction<User>) => {
            // Prevent duplicates - check if follower already exists
            const existingIndex = state.followers.findIndex(f => f.id === action.payload.id);
            if (existingIndex === -1) {
                state.followers.push(action.payload);
            } else {
                // Update existing follower (in case profile changed)
                state.followers[existingIndex] = action.payload;
            }
        },
        followerRemoved: (state, action: PayloadAction<string>) => {
            state.followers = state.followers.filter(follow => follow.id !== action.payload);
        },
        updateUserProfilePicture: (state, action: PayloadAction<{ userId: string, profilePicture: string | null }>) => {
            const follower = state.followers.find(f => f.id === action.payload.userId);
            if (follower) {
                follower.profilePicture = action.payload.profilePicture;
            }
        }
    }
});

export const { init, newFollower, followerRemoved, updateUserProfilePicture } = followersSlice.actions;

export default followersSlice.reducer;