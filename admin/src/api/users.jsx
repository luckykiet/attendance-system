import axiosServices from '@/utils/axios';

const axios = axiosServices('/mod/users');

export const fetchUsers = async (filters) => {
    const { data: { success, msg } } = await axios.post(`/`, filters);
    if (!success) {
        throw new Error(msg);
    }
    return msg;
};