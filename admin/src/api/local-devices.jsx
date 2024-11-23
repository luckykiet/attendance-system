import axiosServices from '@/utils/axios';

const axios = axiosServices('/mod/local-devices');

export const getLocalDevicesByRegisterId = async (id) => {
    const { data: { success, msg } } = await axios.get(`/${id}`);
    if (!success) {
        throw new Error(msg);
    }
    return msg;
};