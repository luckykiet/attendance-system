import axiosServices from '@/utils/axios';

const axios = axiosServices('/mod/user');

export const fetchUser = async (id) => {
    const { data: { success, msg } } = await axios.get(`/${id}`);
    if (!success) {
        throw new Error(msg);
    }
    return msg;
};

export const updateUser = async (data) => {
    const { data: { success, msg } } = await axios.put(`/`, data,
        {
            headers: {
                'Content-Type': 'application/json',
                recaptcha: data.recaptcha,
                action: 'updateuser',
            },
        }
    );
    if (!success) {
        throw new Error(msg);
    }
    return msg;
};

export const createUser = async (data) => {
    const { data: { success, msg } } = await axios.post(`/`, data,
        {
            headers: {
                'Content-Type': 'application/json',
                recaptcha: data.recaptcha,
                action: 'createuser',
            },
        }
    );
    if (!success) {
        throw new Error(msg);
    }
    return msg;
};

export const deleteUser = async (id, recaptcha) => {
    const { data: { success, msg } } = await axios.delete(`/${id}`,
        {
            headers: {
                'Content-Type': 'application/json',
                recaptcha: recaptcha,
                action: 'deleteuser',
            },
        }
    );
    if (!success) {
        throw new Error(msg);
    }
    return msg;
};
