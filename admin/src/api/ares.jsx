import axiosServices from '@/utils/axios';

const axios = axiosServices('/api/ares');

export const fetchAresWithTin = async (tin) => {
    const { data } = await axios.get(`/${tin}`);

    if (data.success && typeof data.msg !== 'string') {
        return data.msg;
    } else {
        throw new Error(typeof data.msg === 'string' ? data.msg : 'Unknown error');
    }
};