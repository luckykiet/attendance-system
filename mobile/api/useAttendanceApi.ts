import { AttendanceMutation } from '@/types/attendance';
import createAxiosService from '@/utils/axios';
import dayjs from 'dayjs';
import JWT from 'expo-jwt';
import { SupportedAlgorithms } from 'expo-jwt/dist/types/algorithms';

export const useAttendanceApi = () => {
    const routePrefix = '/api/attendance';
    const logAttendance = async ({ domain, registerId, deviceKey, latitude, longitude, localDeviceId }: AttendanceMutation) => {
        const payload = { registerId, latitude, longitude, timestamp: dayjs().unix(), localDeviceId };

        const token = JWT.encode(payload, deviceKey, { algorithm: SupportedAlgorithms.HS512 });
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
