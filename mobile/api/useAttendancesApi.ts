import createAxiosService from '@/utils/axios';

export const useAttendancesApi = () => {
    const routePrefix = '/api/attendances';
    const getAttendances = async ({ domain, limit = 10, skip = 0 }: { domain: string, limit: number, skip: number }) => {
        const axiosInstance = createAxiosService({ serverUrl: domain, route: routePrefix, timeout: 5000 });
        const { data: { success, msg } } = await axiosInstance.get('', {
            params: { limit, skip },
        });

        if (!success) {
            throw new Error(msg);
        }

        return msg;
    };


    return { getAttendances };
};
