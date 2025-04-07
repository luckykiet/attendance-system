import { AttendanceMutation } from '@/types/attendance';
import { signJwt } from '@/utils';
import createAxiosService from '@/utils/axios';

export const useAttendanceApi = () => {
    const routePrefix = '/api/attendance';
    const logAttendance = async ({ domain, registerId, deviceKey, latitude, longitude, localDeviceId }: AttendanceMutation) => {
        const payload = { registerId, latitude, longitude, localDeviceId };

        const token = signJwt(payload, deviceKey);
        const axiosInstance = createAxiosService({ serverUrl: domain, route: routePrefix, timeout: 5000 });
        const { data: { success, msg, localDevices } } = await axiosInstance.post('/', {
            ...payload,
            token,
        });

        if (!success) {
            throw new Error(msg);
        }

        return { msg, localDevices };
    };

    return { logAttendance };
};
