import { CancelDevicePairingMutation } from '@/components/MyCompanies';
import { DEFAULT_AXIOS_TIMEOUT } from '@/constants/App';
import { signJwt } from '@/utils';
import createAxiosService from '@/utils/axios';

export const useEmployeeApi = () => {

    const routePrefix = '/api/employee';

    const cancelDevicePairing = async ({ domain, retailId, deviceKey }: CancelDevicePairingMutation) => {
        const payload = { retailId };
        const token = signJwt(payload, deviceKey);
        const axiosInstance = createAxiosService({ serverUrl: domain, route: routePrefix, timeout: DEFAULT_AXIOS_TIMEOUT });
        const { data: { success, msg } } = await axiosInstance.post('/cancel-pairing', {
            ...payload,
            token,
        });

        if (!success) {
            throw new Error(msg);
        }

        return msg;
    };

    return { cancelDevicePairing };
};
