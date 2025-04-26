import { useQueries } from '@tanstack/react-query';
import { GetMyCompaniesResult } from '@/types/workplaces';
import { useCompaniesApi } from '@/api/useCompaniesApi';
import useScheduleWeekShifts from './useScheduleWeekShifts';
import { useAppStore } from '@/stores/useAppStore';
import { useEffect } from 'react';
import _ from 'lodash';

const useMyCompaniesByDomain = () => {
    const { appId, urls, myWorkplaces, setMyWorkplaces } = useAppStore();
    const { getMyCompanies } = useCompaniesApi();

    const queryResults = useQueries({
        queries: urls.map((url) => ({
            queryKey: ['myCompanies', appId, url],
            queryFn: () => getMyCompanies(url),
            enabled: !!appId && urls.length > 0 && !!myWorkplaces,
        })),
        combine: (results) => {
            const dataByDomain: Record<string, GetMyCompaniesResult> = {};
            results.forEach((result, i) => {
                const url = urls[i];
                if (result.data) {
                    dataByDomain[url] = result.data;
                }
            });

            return {
                isLoading: results.some((r) => r.isLoading),
                isFetching: results.some((r) => r.isFetching),
                data: dataByDomain,
                refetch: () => results.forEach((r) => r.refetch()),
            };
        },
    });

    useEffect(() => {
        const allSuccess = !queryResults.isFetching && !queryResults.isLoading;
        if (allSuccess) {
            if (!_.isEmpty(queryResults.data)) {
                setMyWorkplaces(queryResults.data);
            } else {
                setMyWorkplaces(null);
            }
        }
    }, [queryResults.data, queryResults.isFetching, queryResults.isLoading]);

    useEffect(() => {
        if (!myWorkplaces) {
            queryResults.refetch();
        }
    }, [myWorkplaces]);

    useScheduleWeekShifts(queryResults.data);

    return queryResults;
};

export default useMyCompaniesByDomain;