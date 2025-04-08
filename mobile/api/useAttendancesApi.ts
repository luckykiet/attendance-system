import { DEFAULT_AXIOS_TIMEOUT } from '@/constants/App';
import createAxiosService from '@/utils/axios';

export const useAttendancesApi = () => {
    const routePrefix = '/api/attendances';
    const getAttendances = async ({ domain, limit = 10, skip = 0 }: { domain: string, limit: number, skip: number }) => {
        const axiosInstance = createAxiosService({ serverUrl: domain, route: routePrefix, timeout: DEFAULT_AXIOS_TIMEOUT });
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
