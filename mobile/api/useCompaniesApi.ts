import createAxiosService from '@/utils/axios';

export const useCompaniesApi = () => {
    const routePrefix = '/api';
    const getNearbyCompanies = async (serverUrl: string, formData: { longitude: number; latitude: number } | null) => {
        if (!formData) {
            return [];
        }
        const axiosInstance = createAxiosService({ serverUrl, route: routePrefix, timeout: 5000 });
        const { data: { success, msg } } = await axiosInstance.post('/nearby-companies', {
            longitude: formData.longitude,
            latitude: formData.latitude,
        });

        if (!success) {
            throw new Error(msg);
        }

        return msg;
    };

    return { getNearbyCompanies };
};
