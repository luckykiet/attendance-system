import { DEFAULT_AXIOS_TIMEOUT } from "@/constants/App";
import { RegistrationSubmitForm } from "@/types/registration";
import createAxiosService from "@/utils/axios";

export const useRegistrationApi = () => {
    const routePrefix = '/api/registration';
    const getRegistration = async (serverUrl: string, tokenId: string) => {
        const axiosInstance = createAxiosService({ serverUrl, route: routePrefix, timeout: DEFAULT_AXIOS_TIMEOUT });
        const { data: { success, msg } } = await axiosInstance.get(`/${tokenId}`);
        if (!success) {
            throw new Error(msg);
        }
        return msg;
    };

    const submitRegistration = async (serverUrl: string, formData: RegistrationSubmitForm) => {
        const axiosInstance = createAxiosService({ serverUrl, route: routePrefix, timeout: DEFAULT_AXIOS_TIMEOUT });
        const { data: { success, msg } } = await axiosInstance.post(`/`, formData);
        if (!success) {
            throw new Error(msg);
        }
        return msg;
    };

    return { getRegistration, submitRegistration };
}
