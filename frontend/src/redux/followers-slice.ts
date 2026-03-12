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
            const dedupedById = new Map<string, User>();
            action.payload.forEach(user => {
                dedupedById.set(String(user.id).toLowerCase(), user);
            });
            state.followers = [...dedupedById.values()];
        },
        newFollower: (state, action: PayloadAction<User>) => {
            const targetId = String(action.payload.id).toLowerCase();
            const existingIndex = state.followers.findIndex(f => String(f.id).toLowerCase() === targetId);
            if (existingIndex === -1) {
                state.followers.push(action.payload);
            } else {
                state.followers[existingIndex] = action.payload;
            }
        },
        followerRemoved: (state, action: PayloadAction<string>) => {
            const targetId = String(action.payload).toLowerCase();
            state.followers = state.followers.filter(follow => String(follow.id).toLowerCase() !== targetId);
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