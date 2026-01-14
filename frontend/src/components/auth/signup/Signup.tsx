import { useContext, useState } from 'react';
import SpinnerButton from '../../common/spinner-button/SpinnerButton';
import './Signup.css';
import { useForm } from 'react-hook-form';
import type SignupModel from '../../../models/signup';
import authService from '../../../services/auth';
import AuthContext from '../auth/AuthContext';
import { Link } from 'react-router-dom';
import ProfilePictureService from '../../../services/auth-aware/ProfilePictureService';

export default function Signup() {

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors }, setError, watch } = useForm<SignupModel>();

    const authContext = useContext(AuthContext);

    const password = watch('password');

    async function submit(signupData: SignupModel) {
        try {
            setIsSubmitting(true);
            
            // Remove confirmPassword before sending to backend
            const { confirmPassword, ...signupPayload } = signupData;
            const { jwt } = await authService.signup(signupPayload);
            authContext?.newJwt(jwt);

            // If profile picture was selected, upload it
            if (profilePictureFile) {
                try {
                    const profilePictureService = new ProfilePictureService(jwt, 'signup');
                    await profilePictureService.uploadProfilePicture(profilePictureFile);
                } catch (e) {
                    // Silently fail - profile picture upload is optional
                    console.error('Failed to upload profile picture:', e);
                }
            }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            let errorMessage = "Signup failed. Please try again.";
            
            if (e?.response) {
                // Backend sends error messages as plain text in the response body
                // For 422 validation errors and other errors, the message is in response.data
                const responseData = e.response.data;
                
                if (typeof responseData === 'string') {
                    // Plain text error message
                    errorMessage = responseData;
                } else if (responseData && typeof responseData === 'object') {
                    // JSON error response (if backend sends JSON in the future)
                    errorMessage = responseData.message || responseData.error || errorMessage;
                }
            } else if (e?.message) {
                // Network error or other error without response
                errorMessage = e.message;
            }
            
            setError("root", { message: errorMessage });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className='Signup'>
            <div className="signup-container">
                <div className="signup-header">
                    <h1>Create an account</h1>
                    <p>Sign up to get started</p>
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
                        <label htmlFor="name">Name</label>
                        <input
                            id="name"
                            placeholder='Enter your name'
                            {...register('name', { 
                                required: "Name is required",
                                minLength: {
                                    value: 2,
                                    message: "Name must be at least 2 characters"
                                }
                            })}
                        />
                        {errors.name?.message && (
                            <div className="error-box">{errors.name.message}</div>
                        )}
                    </div>

                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            placeholder='Enter your email'
                            {...register('email', { 
                                required: "Email is required",
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: "Invalid email address"
                                }
                            })}
                        />
                        {errors.email?.message && (
                            <div className="error-box">{errors.email.message}</div>
                        )}
                    </div>

                    <div className="input-group">
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            placeholder='Enter your username'
                            {...register('username', { 
                                required: "Username is required",
                                minLength: {
                                    value: 6,
                                    message: "Username must be at least 6 characters"
                                }
                            })}
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
                            {...register('password', { 
                                required: "Password is required",
                                minLength: {
                                    value: 6,
                                    message: "Password must be at least 6 characters"
                                }
                            })}
                        />
                        {errors.password?.message && (
                            <div className="error-box">{errors.password.message}</div>
                        )}
                    </div>

                    <div className="input-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            id="confirmPassword"
                            placeholder='Confirm your password'
                            type="password"
                            {...register('confirmPassword', { 
                                required: "Please confirm your password",
                                validate: (value) => 
                                    value === password || "Passwords do not match"
                            })}
                        />
                        {errors.confirmPassword?.message && (
                            <div className="error-box">{errors.confirmPassword.message}</div>
                        )}
                    </div>

                    <div className="input-group profile-picture-optional">
                        <label htmlFor="profilePicture">Profile Picture (Optional)</label>
                        <input
                            id="profilePicture"
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    // Validate file size (5MB)
                                    if (file.size > 5 * 1024 * 1024) {
                                        setError("root", { message: "Profile picture must be less than 5MB" });
                                        return;
                                    }
                                    setProfilePictureFile(file);
                                    setPreview(URL.createObjectURL(file));
                                } else {
                                    setProfilePictureFile(null);
                                    setPreview(null);
                                }
                            }}
                        />
                        {preview && (
                            <div className="profile-picture-preview-small">
                                <img src={preview} alt="Preview" />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setProfilePictureFile(null);
                                        setPreview(null);
                                        const input = document.getElementById('profilePicture') as HTMLInputElement;
                                        if (input) input.value = '';
                                    }}
                                    className="remove-preview-btn"
                                >
                                    ×
                                </button>
                            </div>
                        )}
                    </div>

                    <SpinnerButton
                        buttonText='Sign up'
                        loadingText='Signing up...'
                        isSubmitting={isSubmitting}
                    />

                    <div className="signup-footer">
                        <p>
                            Already have an account? <Link to="/login">Login</Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
