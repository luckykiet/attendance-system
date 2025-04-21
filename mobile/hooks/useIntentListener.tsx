import { useEffect, useState } from 'react';
import { Alert, Linking } from 'react-native';
import * as DeepLinking from 'expo-linking';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
    const queryClient = useQueryClient();
    const navigation = useNavigation();
    const { setRegistration } = useAppStore();
    const { getRegistration } = useRegistrationApi();
    const [intentData, setIntentData] = useState<IntentData>({});

    useEffect(() => {
        const handleUrl = (event: { url: string }) => {
            const parsedUrl = DeepLinking.parse(event.url);
            const { queryParams } = parsedUrl;

            const domain = Array.isArray(queryParams?.domain) ? queryParams.domain[0] : queryParams?.domain;
            const tokenId = Array.isArray(queryParams?.tokenId) ? queryParams.tokenId[0] : queryParams?.tokenId;

            setIntentData({
                domain: domain || undefined,
                tokenId: tokenId || undefined,
            });
        };

        Linking.getInitialURL().then((url) => {
            if (url) handleUrl({ url });
        });

        const subscription = Linking.addEventListener('url', handleUrl);

        return () => {
            subscription.remove();
        };
    }, []);

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
            queryClient.refetchQueries({ predicate: (query) => query.queryKey[0] === 'registrationForm' });
            queryClient.removeQueries({ queryKey: ['registrationForm'] });
        }

        if (isError) {
            Alert.alert(
                t("misc_error"),
                t(typeof error === "string" ? error : error.message || "misc_error"),
                [{ text: "OK" }]
            );
            setIntentData({});
            queryClient.refetchQueries({ predicate: (query) => query.queryKey[0] === 'registrationForm' });
            queryClient.removeQueries({ queryKey: ['registrationForm'] });
        }
    }, [registrationForm, isError, error, intentData, setRegistration, navigation]);

    return null;
}
