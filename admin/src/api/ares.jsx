import axiosServices from '@/utils/axios';

const axios = axiosServices('/api/ares');

export const fetchAresWithTin = async (form) => {
    const { data: { success, msg } } = await axios.get(`/${form.tin}`,
        {
            headers: {
                'Content-Type': 'application/json',
                recaptcha: form.recaptcha,
                action: 'ares',
            },
        }
    );
    if (success && typeof msg !== 'string') {
        return msg;
    } else {
        throw new Error(typeof msg === 'string' ? msg : 'Unknown error');
    }
};