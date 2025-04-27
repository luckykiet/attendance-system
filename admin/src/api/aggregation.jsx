import axiosServices from '@/utils/axios';

const axios = axiosServices('/mod/aggregation');

export const fetchRegisterAggregation = async (form) => {
    const { data: { success, msg } } = await axios.get(`/register/${form.registerId}`,
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

export const fetchEmployeeAggregation = async (form) => {
    const { data: { success, msg } } = await axios.get(`/employee/${form.employeeId}`,
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