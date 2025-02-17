import axiosServices from '@/utils/axios';

const axios = axiosServices('/auth');

export const getConfig = async () => {
    const {
        data: { success, msg },
    } = await axios.post('/config');

    if (!success) {
        return null;
    }
    return msg;
};