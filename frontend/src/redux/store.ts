import { configureStore } from "@reduxjs/toolkit";
import followersSlice from "./followers-slice";
import followingSlice from "./following-slice";
import profileSlice from "./profile-slice";
import feedSlice from "./feed-slice";
import messagesSlice from "./messages-slice";

const store = configureStore({
    reducer: {
        followersSlice,
        followingSlice,
        profileSlice,
        feedSlice,
        messagesSlice
    }
});

export default store;

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch