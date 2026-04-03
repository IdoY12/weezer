import { useContext } from "react";
import type AuthAware from "../services/auth-aware/AuthAware";
import SocketDispatcherContext from "../components/socket.io/SocketDispatcherContext";

export default function useService<T extends AuthAware>(Service: { new(jwt: string, clientId: string): T }): T {
    const socketDispatcherContext = useContext(SocketDispatcherContext);

    const service = new Service("", socketDispatcherContext!.clientId);

    return service;
}
