import axiosServices from '@/utils/axios';

const axios = axiosServices('/mod/employee');

export const fetchEmployee = async (id) => {
    const { data: { success, msg } } = await axios.get(`/${id}`);
    if (!success) {
        throw new Error(msg);
    }
    return msg;
};

export const createEmployeeDeviceRegistration = async (employeeId, send = false) => {
    const { data: { success, msg } } = await axios.post(`/registration${send ? "/send" : ''}`, { employeeId });
    if (!success) {
        throw new Error(msg);
    }
    return msg;
};

export const fetchEmployeeWorkingAt = async (id) => {
    const { data: { success, msg } } = await axios.get(`/working-at/${id}`);
    if (!success) {
        throw new Error(msg);
    }
    return msg;
};

export const updateEmployee = async (data) => {
    const { data: { success, msg } } = await axios.put(`/`, data,
        {
            headers: {
                'Content-Type': 'application/json',
                recaptcha: data.recaptcha,
                action: 'updateemployee',
            },
        }
    );
    if (!success) {
        throw new Error(msg);
    }
    return msg;
};

export const createEmployee = async (data) => {
    const { data: { success, msg } } = await axios.post(`/`, data,
        {
            headers: {
                'Content-Type': 'application/json',
                recaptcha: data.recaptcha,
                action: 'createemployee',
            },
        }
    );
    if (!success) {
        throw new Error(msg);
    }
    return msg;
};

export const deleteEmployee = async (id, recaptcha) => {
    const { data: { success, msg } } = await axios.delete(`/${id}`,
        {
            headers: {
                'Content-Type': 'application/json',
                recaptcha: recaptcha,
                action: 'deleteemployee',
            },
        }
    );
    if (!success) {
        throw new Error(msg);
    }
    return msg;
};

export const cancelPairingDevice = async (id, recaptcha) => {
    const { data: { success, msg } } = await axios.put(`/cancel-pairing/${id}`,
        {
            headers: {
                'Content-Type': 'application/json',
                recaptcha: recaptcha,
                action: 'cancelpairing',
            },
        }
    );
    if (!success) {
        throw new Error(msg);
    }
    return msg;
};