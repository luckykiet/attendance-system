import createAxiosService from "@/utils/axios";

export const useIntentApi = () => {
    const getIntentFromUrl = async (url: string) => {
        const axiosInstance = createAxiosService();
        const { data } = await axiosInstance.get(url);
        return data;
    };

    return { getIntentFromUrl };
}
