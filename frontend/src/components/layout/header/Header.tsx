import { NavLink } from 'react-router-dom';
import './Header.css';
import { useContext } from 'react';
import AuthContext from '../../auth/auth/AuthContext';
import useCurrentUser from '../../../hooks/use-current-user';
import ProfilePicture from '../../common/profile-picture/ProfilePicture';

export default function Header() {
    const authContext = useContext(AuthContext);

    const { user } = useCurrentUser();

    function logout() {
        authContext?.newJwt('');
    }

    return (
        <div className='Header'>
            {/* Logo Section */}
            <div className="header-logo">
                <div className="logo-icon">
                    <span className="logo-w">W</span>
                </div>
                <span className="logo-text">Weezer</span>
            </div>

            {/* Centered Navigation */}
            <nav className="header-nav">
                <NavLink to="/profile" className="nav-link">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>Profile</span>
                </NavLink>
                <NavLink to="/feed" className="nav-link">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 11a9 9 0 0 1 9 9" />
                        <path d="M4 4a16 16 0 0 1 16 16" />
                        <circle cx="5" cy="19" r="1" />
                    </svg>
                    <span>Feed</span>
                </NavLink>
                <NavLink to="/search" className="nav-link">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                    </svg>
                    <span>Search</span>
                </NavLink>
                <NavLink to="/following" className="nav-link">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span>Following</span>
                </NavLink>
                <NavLink to="/followers" className="nav-link">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span>Followers</span>
                </NavLink>
                <NavLink to="/translations" className="nav-link nav-link-translate">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m5 8 6 6" />
                        <path d="m4 14 6-6 2-3" />
                        <path d="M2 5h12" />
                        <path d="M7 2h1" />
                        <path d="m22 22-5-10-5 10" />
                        <path d="M14 18h6" />
                    </svg>
                    <span>AI Translate</span>
                </NavLink>
                <NavLink to="/settings" className="nav-link">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
                    </svg>
                    <span>Settings</span>
                </NavLink>
            </nav>

            {/* User Section */}
            <div className="header-user">
                {user ? (
                    <ProfilePicture user={user} size={40} />
                ) : (
                    <div className="user-avatar">
                        U
                    </div>
                )}
                <div className="user-info">
                    <span className="user-greeting">Welcome back</span>
                    <span className="user-name">{user?.name || 'User'}</span>
                </div>
                <button onClick={logout} className="logout-btn" title="Sign out">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16,17 21,12 16,7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
