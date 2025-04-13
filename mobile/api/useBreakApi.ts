import { DEFAULT_AXIOS_TIMEOUT } from '@/constants/App';
import { BreakMutation } from '@/types/breaks';
import { signJwt } from '@/utils';
import createAxiosService from '@/utils/axios';

export const useBreakApi = () => {
    const routePrefix = '/api/break';

    const applyBreak = async (formData: BreakMutation) => {
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

    return { applyBreak };
};
