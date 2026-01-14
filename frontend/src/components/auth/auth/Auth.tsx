import { useEffect, useMemo, useState, type PropsWithChildren } from "react";
import AuthContext from "./AuthContext";
import { useSearchParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import type User from "../../../models/user";

export default function Auth(props: PropsWithChildren) {

    const [jwt, setJwt] = useState<string>(localStorage.getItem('jwt') || '');

    const { children } = props;

    const [searchParams] = useSearchParams();

    function newJwt(jwt: string) {
        setJwt(jwt);
        localStorage.setItem('jwt', jwt);
    }

    useEffect(() => {
        if(searchParams.get('jwt')) {
            newJwt(searchParams.get('jwt')!);
        }
    }, [searchParams]);

    const decoded = useMemo(() => {
        if(!jwt) return
        return jwtDecode(jwt) as User
    }, [jwt])

    const isPay = decoded?.isPay ?? false

    return (
        <AuthContext.Provider value={{ jwt, newJwt, isPay }}>
            {children}
        </AuthContext.Provider>
    );
}