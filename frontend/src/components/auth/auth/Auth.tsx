import { useEffect, useState, type PropsWithChildren } from "react";
import AuthContext from "./AuthContext";
import authService from "../../../services/auth";
import type User from "../../../models/user";

export default function Auth(props: PropsWithChildren) {

    const [user, setUser] = useState<User | null>(null);

    const { children } = props;

    useEffect(() => {
        authService.fetchCsrf()
            .then(() => authService.me())
            .then(({ user: u }) => setUser(u))
            .catch(() => setUser(null));
    }, []);

    const isPay = user?.isPay ?? false;

    return (
        <AuthContext.Provider value={{ user, setUser, isPay }}>
            {children}
        </AuthContext.Provider>
    );
}
