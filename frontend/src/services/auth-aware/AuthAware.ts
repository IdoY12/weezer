import type { AxiosInstance } from "axios";
import axios from "axios";
import { getCsrfTokenFromCookie } from "../../utils/csrf-token";

export default abstract class AuthAware {
    axiosInstance: AxiosInstance;

    constructor(_jwt: string, clientId: string) {
        this.axiosInstance = axios.create({
            baseURL: import.meta.env.VITE_REST_SERVER_URL,
            withCredentials: true,
            headers: { "x-client-id": `${clientId}` },
        });
        // The CSRF value is stable for a while, but not “frozen at axios.create() time”:
        // - the cookie may not exist yet when this instance is constructed (race with /auth/csrf or login);
        // - the server can replace it on login, /auth/me, or /auth/csrf;
        // `headers` in `create()` are evaluated once only, so we read the cookie on each request to always match the browser’s current cookie.
        this.axiosInstance.interceptors.request.use((config) => {
            const t = getCsrfTokenFromCookie();
            if (t) config.headers.set("x-csrf-token", t);
            return config;
        });
    }
}
