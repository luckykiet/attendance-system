import axiosServices from '@/utils/axios';

const axios = axiosServices('/mod/aggregation');

export const fetchRegisterAggregation = async (form) => {
    const { data: { success, msg } } = await axios.get(`/${form.registerId}`,
        {
            params: {
                start: form.start,
                end: form.end,
            }
        }
    );
    if (!success) {
        throw new Error(msg);
    }
    return msg;
};