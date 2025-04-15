import { DEFAULT_AXIOS_TIMEOUT } from '@/constants/App';
import { GetMyAttendancesResult, GetMyRetailAttendancesResult } from '@/types/attendance';
import createAxiosService from '@/utils/axios';

export const useAttendancesApi = () => {
    const routePrefix = '/api/attendances';
    const getAttendances = async ({ domain, limit = 10, skip = 0 }: { domain: string, limit: number, skip: number }): Promise<GetMyAttendancesResult> => {
        const axiosInstance = createAxiosService({ serverUrl: domain, route: routePrefix, timeout: DEFAULT_AXIOS_TIMEOUT });
        const { data: { success, msg } } = await axiosInstance.get('', {
            params: { limit, skip },
        });

        if (!success) {
            throw new Error(msg);
        }

        return {
            ...msg,
            domain,
        };
    };

    const getAttendancesByRetail = async ({ retailId, domain, limit = 10, skip = 0 }: { retailId: string, domain: string, limit: number, skip: number }): Promise<GetMyRetailAttendancesResult> => {
        const axiosInstance = createAxiosService({ serverUrl: domain, route: routePrefix, timeout: DEFAULT_AXIOS_TIMEOUT });
        const { data: { success, msg } } = await axiosInstance.get(`/${retailId}`, {
            params: { limit, skip },
        });

        if (!success) {
            throw new Error(msg);
        }

        return {
            ...msg,
            domain,
        };
    };


    return { getAttendances, getAttendancesByRetail };
};
