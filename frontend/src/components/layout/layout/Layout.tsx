import { useContext } from 'react';
import { useLocation } from 'react-router-dom';
import Footer from '../footer/Footer';
import Header from '../header/Header';
import Main from '../main/Main';
import './Layout.css';
import Login from '../../auth/login/Login';
import Signup from '../../auth/signup/Signup';
import AuthContext from '../../auth/auth/AuthContext';

export default function Layout() {

    const authContext = useContext(AuthContext);
    const isLoggedIn = !!authContext?.user;
    const location = useLocation();

    return (
        <div className='Layout'>

            {isLoggedIn && <>
                <header>
                    <Header />
                </header>
                
                <main className="main-content">
                    <Main />
                </main>
                
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
