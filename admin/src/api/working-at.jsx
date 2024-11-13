import axiosServices from '@/utils/axios';

const axios = axiosServices('/mod/working-at');

export const createOrUpdateWorkingAt = async (data) => {
    const { data: { success, msg } } = await axios.post(`/`, data,
        {
            headers: {
                'Content-Type': 'application/json',
                recaptcha: data.recaptcha,
                action: 'createworkingat',
            },
        }
    );
    if (!success) {
        throw new Error(msg);
    }
    return msg;
};