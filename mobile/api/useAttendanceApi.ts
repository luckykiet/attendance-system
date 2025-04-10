import { DEFAULT_AXIOS_TIMEOUT } from '@/constants/App';
import { AttendanceMutation } from '@/types/attendance';
import { signJwt } from '@/utils';
import createAxiosService from '@/utils/axios';

export const useAttendanceApi = () => {
    const routePrefix = '/api/attendance';
    const logAttendance = async (formData: AttendanceMutation) => {
        const { registerId, retailId, shiftId, deviceKey, domain, latitude, longitude, localDeviceId } = formData;
        const payload = { registerId, retailId, latitude, longitude, localDeviceId, shiftId };

        const token = signJwt(payload, deviceKey);

        const axiosInstance = createAxiosService({ serverUrl: domain, route: routePrefix, timeout: DEFAULT_AXIOS_TIMEOUT });
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
