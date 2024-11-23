import createAxiosService from "@/utils/axios";

export const useIntentApi = () => {
    const getIntentFromUrl = async (url: string) => {
        const axiosInstance = createAxiosService();
        const { data } = await axiosInstance.get(url, { maxRedirects: 0 });
        return data;
    };

    return { getIntentFromUrl };
}
