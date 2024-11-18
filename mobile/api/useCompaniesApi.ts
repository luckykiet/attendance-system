import createAxiosService from '@/utils/axios';

export const useCompaniesApi = () => {
    const routePrefix = '/api/workplaces';
    const getTodayWorkplaces = async (serverUrl: string, formData: { longitude: number; latitude: number } | null) => {
        const axiosInstance = createAxiosService({ serverUrl, route: routePrefix, timeout: 5000 });
        const { data: { success, msg } } = await axiosInstance.post('/', {
            longitude: formData?.longitude || null,
            latitude: formData?.latitude || null,
        });

        if (!success) {
            throw new Error(msg);
        }

        return msg.map((company: any) => ({ ...company, domain: serverUrl }));;
    };

    const getMyCompanies = async (serverUrl: string) => {
        const axiosInstance = createAxiosService({ serverUrl, route: routePrefix, timeout: 5000 });
        const { data: { success, msg } } = await axiosInstance.get('/');

        if (!success) {
            throw new Error(msg);
        }
        
        return { ...msg, domain: serverUrl }
    };
    return { getTodayWorkplaces, getMyCompanies };
};
