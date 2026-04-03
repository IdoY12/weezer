import { createContext } from "react";
import type User from "../../../models/user";

interface AuthContextInterface {
    user: User | null;
    isPay: boolean;
    setUser(user: User | null): void;
}

const AuthContext = createContext<AuthContextInterface | null>(null);
export default AuthContext;
