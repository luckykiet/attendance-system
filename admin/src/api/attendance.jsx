import axiosServices from '@/utils/axios';

const axios = axiosServices('/mod/attendance');

export const updateAttendance = async (data) => {
    const { data: { success, msg } } = await axios.put(`/`, data);
    if (!success) {
        throw new Error(msg);
    }
    return msg;
};
