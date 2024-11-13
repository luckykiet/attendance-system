import axiosServices from '@/utils/axios';

const axios = axiosServices('/mod/working-ats');

export const updateWorkingAts = async (data) => {
    const { data: { success, msg } } = await axios.post(`/`, data,
        {
            headers: {
                'Content-Type': 'application/json',
                recaptcha: data.recaptcha,
                action: 'updateworkingats',
            },
        }
    );
    if (!success) {
        throw new Error(msg);
    }
    return msg;
};