import { AresCompany } from '@/types/company';
import axiosServices from '@/utils/axios';


const useAresApi = () => {
    const axios = axiosServices('/api');

    const fetchAresWithTin = async (tin: string): Promise<AresCompany> => {
        const { data } = await axios.get<{
            success: boolean;
            msg: AresCompany | string;
        }>(`/ares/${tin}`);

        if (data.success && typeof data.msg !== 'string') {
            return data.msg;
        } else {
            throw new Error(typeof data.msg === 'string' ? data.msg : 'Unknown error');
        }
    };

    return { fetchAresWithTin };
};

export default useAresApi;
