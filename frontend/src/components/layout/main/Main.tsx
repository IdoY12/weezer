import { Navigate, Route, Routes } from "react-router-dom";
import Profile from "../../posts/profile/Profile";
import Feed from "../../posts/feed/Feed";
import NotFound from "../not-found/NotFound";
import EditPost from "../../posts/edit/EditPost";
import Translations from "../../translations/Translation";
import Following from "../../follows/following/Following";
import Followers from "../../follows/followers/Followers";
import Search from "../../search/Search";
import Settings from "../../settings/Settings";

export default function Main() {
    return (
        <Routes>
            {/* <Route path="/" element={<Profile />} /> */}
            <Route path="/" element={<Navigate to="/profile" />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/edit/:id" element={<EditPost />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/following" element={<Following />} />
            <Route path="/followers" element={<Followers />} />
            <Route path="/search" element={<Search />} />
            <Route path="/translations" element={<Translations />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/signup" element={<Navigate to="/profile" />} />
            <Route path="/login" element={<Navigate to="/profile" />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}
