import { useContext, useMemo } from "react";
import AuthContext from "../components/auth/auth/AuthContext";

export default function useUsername() {
    const authContext = useContext(AuthContext);

    const name = useMemo(() => {
        return authContext?.user?.name ?? "";
    }, [authContext?.user?.name]);

    return name;

}
