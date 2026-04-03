import axios from "axios";
import type Login from "../models/login";
import type Signup from "../models/signup";
import type User from "../models/user";
import { csrfHeaders } from "../utils/csrf-token";

class AuthService {
    async fetchCsrf(): Promise<void> {
        await axios.get(`${import.meta.env.VITE_REST_SERVER_URL}/auth/csrf`, {
            withCredentials: true,
        });
    }

    async login(login: Login): Promise<{ user: User }> {
        const { data } = await axios.post<{ user: User }>(
            `${import.meta.env.VITE_REST_SERVER_URL}/auth/login`,
            login,
            { withCredentials: true, headers: csrfHeaders() }
        );
        return data;
    }

    async signup(signup: Omit<Signup, 'confirmPassword'>): Promise<{ user: User }> {
        const { data } = await axios.post<{ user: User }>(
            `${import.meta.env.VITE_REST_SERVER_URL}/auth/signup`,
            signup,
            { withCredentials: true, headers: csrfHeaders() }
        );
        return data;
    }

    async me(): Promise<{ user: User }> {
        const { data } = await axios.get<{ user: User }>(
            `${import.meta.env.VITE_REST_SERVER_URL}/auth/me`,
            { withCredentials: true }
        );
        return data;
    }

    async logout(): Promise<void> {
        await axios.post(
            `${import.meta.env.VITE_REST_SERVER_URL}/auth/logout`,
            {},
            { withCredentials: true, headers: csrfHeaders() }
        );
    }
}

const authService = new AuthService();
export default authService;
