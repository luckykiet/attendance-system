import { RegistrationSubmitForm } from "@/types/registration";
import createAxiosService from "@/utils/axios";

export const useRegistrationApi = () => {
    const routePrefix = '/api/registration';
    const getRegistration = async (serverUrl: string, tokenId: string) => {
        const axiosInstance = createAxiosService({ serverUrl, route: routePrefix, timeout: 5000 });
        const { data: { success, msg } } = await axiosInstance.get(`/${tokenId}`);
        if (!success) {
            throw new Error(msg);
        }
        return msg;
    };

    const submitRegistration = async (serverUrl: string, formData: RegistrationSubmitForm ) => {
        const axiosInstance = createAxiosService({ serverUrl, route: routePrefix, timeout: 5000 });
        const { data: { success, msg } } = await axiosInstance.post(`/`, formData);
        if (!success) {
            throw new Error(msg);
        }
        return msg;
    };

    return { getRegistration, submitRegistration };
}
