import { useContext } from "react";
import AuthContext from "../components/auth/auth/AuthContext";

export default function useUserId() {
    const authContext = useContext(AuthContext);

    return authContext?.user?.id;
}
