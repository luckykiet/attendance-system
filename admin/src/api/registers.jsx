import axiosServices from '@/utils/axios';

const axios = axiosServices('/mod/registers');

export const fetchRegisters = async (filter = {}) => {
    const { data: { success, msg } } = await axios.post(`/`, filter);
    if (!success) {
        throw new Error(msg);
    }
    return msg;
};