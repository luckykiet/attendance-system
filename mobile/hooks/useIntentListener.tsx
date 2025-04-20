import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import * as DeepLinking from 'expo-linking';
import { useQuery } from '@tanstack/react-query';
import _ from 'lodash';
import { useRegistrationApi } from '@/api/useRegistrationApi';
import { useNavigation } from 'expo-router';
import { useAppStore } from '@/stores/useAppStore';
import useTranslation from './useTranslation';

type IntentData = {
    domain?: string;
    tokenId?: string;
};

type RegistrationForm = {
    [key: string]: unknown;
};

export default function useIntentListener() {
    const { t } = useTranslation();
    const url = DeepLinking.useLinkingURL();

    const navigation = useNavigation();
    const { setRegistration } = useAppStore();
    const { getRegistration } = useRegistrationApi();
    const [intentData, setIntentData] = useState<IntentData>({});
    const [fetchedUrl, setFetchedUrl] = useState<string>('');
    useEffect(() => {
        if (url) {
            setFetchedUrl(url);
        }
    }, [url]);

    useEffect(() => {
        if (fetchedUrl) {
            const parsedUrl = DeepLinking.parse(fetchedUrl);
            const { queryParams } = parsedUrl;

            const domain = Array.isArray(queryParams?.domain) ? queryParams.domain[0] : queryParams?.domain;
            const tokenId = Array.isArray(queryParams?.tokenId) ? queryParams.tokenId[0] : queryParams?.tokenId;

            setIntentData({
                domain: domain || undefined,
                tokenId: tokenId || undefined,
            });
        }
    }, [fetchedUrl]);

    const registrationFormQuery = useQuery<RegistrationForm, Error>({
        queryKey: ['registrationForm', intentData],
        queryFn: () => getRegistration(intentData.domain || '', intentData.tokenId || ''),
        enabled: !!intentData.domain && !!intentData.tokenId && !_.isEmpty(intentData),
        refetchOnWindowFocus: false,
        retry: false,
        staleTime: Infinity,
    });

    const { data: registrationForm, isError, error } = registrationFormQuery;

    useEffect(() => {
        if (registrationForm) {
            setRegistration({
                ...registrationForm,
                tokenId: intentData.tokenId || '',
                domain: intentData.domain || '',
            });
            navigation.navigate("(hidden)/registration" as never);
            setIntentData({});
            setFetchedUrl('');
        }

        if (isError) {
            Alert.alert(
                t("misc_error"),
                t(typeof error === "string" ? error : error.message || "misc_error"),
                [{ text: "OK" }]
            );
            setFetchedUrl('');
        }
    }, [registrationForm, isError, error, intentData, setRegistration, navigation]);

    return null;
}
