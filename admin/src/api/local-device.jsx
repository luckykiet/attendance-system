import axiosServices from '@/utils/axios';

const axios = axiosServices('/mod/local-device');

export const deleteLocalDevice = async (id) => {
    const { data: { success, msg } } = await axios.delete(`/${id}`);
    if (!success) {
        throw new Error(msg);
    }
    return msg;
};