import axiosServices from '@/utils/axios';

const axios = axiosServices('/mod/employees');

export const fetchEmployees = async (filters) => {
    const { data: { success, msg } } = await axios.post(`/`, filters);
    if (!success) {
        throw new Error(msg);
    }
    return msg;
};