import { createContext } from "react";

interface AuthContextInterface {
    jwt: string,
    isPay: boolean,
    newJwt(jwt: string): void
}

const AuthContext = createContext<AuthContextInterface | null>(null);
export default AuthContext;

