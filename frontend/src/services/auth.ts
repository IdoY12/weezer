import axios from "axios";
import type Login from "../models/login";
import type Signup from "../models/signup";

class AuthService {
    async login(login: Login): Promise<{ jwt: string }> {
        const { data } = await axios.post<{ jwt: string }>(`${import.meta.env.VITE_REST_SERVER_URL}/auth/login`, login);
        return data;
    }

    async signup(signup: Omit<Signup, 'confirmPassword'>): Promise<{ jwt: string }> {
        const { data } = await axios.post<{ jwt: string }>(`${import.meta.env.VITE_REST_SERVER_URL}/auth/signup`, signup);
        return data;
    }
}

const authService = new AuthService();
export default authService;