import { DEFAULT_AXIOS_TIMEOUT } from '@/constants/App';
import { AttendancePauseMutation } from '@/types/pause';
import { signJwt } from '@/utils';
import createAxiosService from '@/utils/axios';

export const usePauseApi = () => {
    const routePrefix = '/api/pause';

    const applyPause = async (formData: AttendancePauseMutation) => {
        const { deviceKey, domain } = formData;
        const payload = JSON.parse(JSON.stringify(formData));
        delete payload.deviceKey;
        delete payload.domain;

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

    return { applyPause };
};
