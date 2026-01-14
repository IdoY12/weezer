import { useContext } from 'react';
import { useLocation } from 'react-router-dom';
import Followers from '../../follows/followers/Followers';
import Following from '../../follows/following/Following';
import Footer from '../footer/Footer';
import Header from '../header/Header';
import Main from '../main/Main';
import './Layout.css';
import Login from '../../auth/login/Login';
import Signup from '../../auth/signup/Signup';
import AuthContext from '../../auth/auth/AuthContext';

export default function Layout() {

    const authContext = useContext(AuthContext);
    const isLoggedIn = !!authContext?.jwt;
    const location = useLocation();

    return (
        <div className='Layout'>

            {isLoggedIn && <>
                <header>
                    <Header />
                </header>
                
                {/* Desktop: 3-column layout */}
                <aside className="sidebar sidebar-left">
                    <div className="sidebar-section">
                        <Following />
                    </div>
                </aside>
                
                <main className="main-content">
                    <Main />
                </main>
                
                <aside className="sidebar sidebar-right">
                    <div className="sidebar-section">
                        <Followers />
                    </div>
                </aside>
                
                <footer>
                    <Footer />
                </footer>
            </>}

            {!isLoggedIn && (
                location.pathname === '/signup' ? <Signup /> : <Login />
            )}
        </div>
    );
}
