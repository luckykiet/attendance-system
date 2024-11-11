import axiosServices from '@/utils/axios';

const axios = axiosServices('/mod/registers');

export const fetchRegisters = async () => {
    const { data: { success, msg } } = await axios.get(`/`);
    if (!success) {
        throw new Error(msg);
    }
    return msg;
};