import './Footer.css';
import useUsername from '../../../hooks/use-username';

export default function Footer() {

    const name = useUsername();

    return (
        <div className='Footer'>
            <span className="footer-brand">© 2026 Weezer</span>
            <span className="footer-divider">•</span>
            <span className="footer-user">Logged in as <strong>{name}</strong></span>
            <span className="footer-divider">•</span>
            <span className="footer-server">Server: {import.meta.env.VITE_REST_SERVER_URL}</span>
        </div>
    );
}
