import axiosServices from '@/utils/axios';

const axios = axiosServices('/mod/attendances');

export const fetchAttendanceByRegisterAndDate = async (data) => {
    const { data: { success, msg } } = await axios.post(`/register`, data);
    if (!success) {
        throw new Error(msg);
    }
    return msg;
};

export const fetchAttendanceByEmployeeAndDate = async (data) => {
    const { data: { success, msg } } = await axios.post(`/employee`, data);
    if (!success) {
        throw new Error(msg);
    }
    return msg;
};