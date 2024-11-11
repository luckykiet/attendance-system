import axiosServices from '@/utils/axios';

const axios = axiosServices('/mod/register');

export const fetchRegister = async (id) => {
    const { data: { success, msg } } = await axios.get(`/${id}`);
    if (!success) {
        throw new Error(msg);
    }
    return msg;
};

export const updateRegister = async (data) => {
    const { data: { success, msg } } = await axios.put(`/`, { data },
        {
            headers: {
                'Content-Type': 'application/json',
                recaptcha: data.recaptcha,
                action: 'updateregister',
            },
        }
    );
    if (!success) {
        throw new Error(msg);
    }
    return msg;
};

export const createRegister = async (data) => {
    const { data: { success, msg } } = await axios.post(`/`, { data },
        {
            headers: {
                'Content-Type': 'application/json',
                recaptcha: data.recaptcha,
                action: 'createregister',
            },
        }
    );
    if (!success) {
        throw new Error(msg);
    }
    return msg;
};

export const deleteRegister = async (id, recaptcha) => {
    const { data: { success, msg } } = await axios.delete(`/${id}`,
        {
            headers: {
                'Content-Type': 'application/json',
                recaptcha: recaptcha,
                action: 'createregister',
            },
        }
    );
    if (!success) {
        throw new Error(msg);
    }
    return msg;
};
