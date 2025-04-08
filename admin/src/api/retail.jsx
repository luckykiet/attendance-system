import axiosServices from '@/utils/axios';

const axios = axiosServices('/mod/retail');

export const fetchRetail = async () => {
    const { data: { msg } } = await axios.get(`/`);
    return msg;
};

export const updateRetail = async (data) => {
    const { data: { success, msg } } = await axios.put(`/`, data,
        {
            headers: {
                'Content-Type': 'application/json',
                recaptcha: data.recaptcha,
                action: 'updateretail',
            },
        }
    );
    if (!success) {
        throw new Error(msg);
    }
    return msg;
};
