import AuthAware from "./AuthAware";
import type User from "../../models/user";

export default class SearchService extends AuthAware {
    async searchUsers(query: string): Promise<User[]> {
        const { data } = await this.axiosInstance.get<User[]>(`/users/search?query=${encodeURIComponent(query)}`);
        return data;
    }
}
