import axiosServices from '@/utils/axios';

const axios = axiosServices('/mod/retail');

export const fetchRetail = async () => {
    const { data: { msg } } = await axios.get(`/`);
    return msg;
};

export const updateRetail = async (data) => {
    const { data: { msg } } = await axios.put(`/`, { data });
    return msg;
};

