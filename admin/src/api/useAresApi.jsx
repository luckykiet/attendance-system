import axiosServices from '@/utils/axios';

const useAresApi = () => {
    const axios = axiosServices('/api');

    const fetchAresWithTin = async (tin) => {
        const { data } = await axios.get(`/ares/${tin}`);

        if (data.success && typeof data.msg !== 'string') {
            return data.msg;
        } else {
            throw new Error(typeof data.msg === 'string' ? data.msg : 'Unknown error');
        }
    };

    return { fetchAresWithTin };
};

export default useAresApi;