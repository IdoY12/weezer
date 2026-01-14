import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import SpinnerButton from '../../common/spinner-button/SpinnerButton';
import './Login.css';
import { useForm } from 'react-hook-form';
import type LoginModel from '../../../models/login';
import authService from '../../../services/auth';
import AuthContext from '../auth/AuthContext';

export default function Login() {

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const { register, handleSubmit, formState: { errors }, setError } = useForm<LoginModel>();

    const authContext = useContext(AuthContext);

    async function submit(login: LoginModel) {
        try {
            setIsSubmitting(true);
            const { jwt } = await authService.login(login);
            authContext?.newJwt(jwt);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            setError("root", { message: e?.response?.data || "Invalid username or password" });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className='Login'>
            <div className="login-container">
                <div className="login-header">
                    <h1>Welcome back</h1>
                    <p>Sign in to your account to continue</p>
                </div>

                <a href={import.meta.env.VITE_GOOGLE_SERVER_URL} className="google-sign-in">
                    <img src="https://img.icons8.com/?size=100&id=17949&format=png&color=000000" alt="Google" />
                    <span>Continue with Google</span>
                </a>

                <div className="divider">
                    <span>or</span>
                </div>

                <form onSubmit={handleSubmit(submit)}>
                    {errors.root?.message && (
                        <div className="error-box">{errors.root.message}</div>
                    )}

                    <div className="input-group">
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            placeholder='Enter your username'
                            {...register('username', { required: "username is required" })}
                        />
                        {errors.username?.message && (
                            <div className="error-box">{errors.username.message}</div>
                        )}
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            placeholder='Enter your password'
                            type="password"
                            {...register('password', { required: "password is required" })}
                        />
                        {errors.password?.message && (
                            <div className="error-box">{errors.password.message}</div>
                        )}
                    </div>

                    <SpinnerButton
                        buttonText='Sign in'
                        loadingText='Signing in...'
                        isSubmitting={isSubmitting}
                    />

                    <div className="login-footer">
                        <p>
                            Don't have an account? <Link to="/signup">Sign up</Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
