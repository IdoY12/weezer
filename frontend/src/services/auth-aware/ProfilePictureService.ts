import type User from "../../models/user";
import AuthAware from "./AuthAware";

export default class ProfilePictureService extends AuthAware {

    async uploadProfilePicture(file: File): Promise<User> {
        const formData = new FormData();
        formData.append('image', file);

        const response = await this.axiosInstance.post<User>(`/users/profile-picture`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    }

    async getCurrentUser(): Promise<User> {
        const response = await this.axiosInstance.get<User>(`/users/me`);
        return response.data;
    }

    async getUserById(id: string): Promise<User> {
        const response = await this.axiosInstance.get<User>(`/users/${id}`);
        return response.data;
    }
}
