import React, { useEffect, useState } from 'react';
import { TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, useColorScheme } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/stores/useAppStore';
import { MainScreenLayout } from '@/layouts/MainScreenLayout';
import useTranslation from '@/hooks/useTranslation';
import ThemedView from '@/components/theme/ThemedView';
import ThemedText from '@/components/theme/ThemedText';
import ThemedTextInput from '@/components/theme/ThemedTextInput';
import ThemedActivityIndicator from '@/components/theme/ThemedActivityIndicator';
import FeedbackMessage from '@/components/FeedbackMessage';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { useRegistrationApi } from '@/api/useRegistrationApi';
import { RegistrationSubmitForm } from '@/types/registration';
import { useNavigation } from 'expo-router';
import useIntentListener from '@/hooks/useIntentListener';

const RegistrationSchema = z.object({
    name: z.string().min(1, 'misc_required'),
    email: z.string().email('srv_invalid_email'),
    phone: z.string().min(7, 'srv_invalid_phone').optional(),
});

type RegistrationFormValues = z.infer<typeof RegistrationSchema>;

const RegistrationScreen: React.FC = () => {
    const queryClient = useQueryClient();
    const { t } = useTranslation();
    const { registration, appId, addUrl, setRegistration, setIntent } = useAppStore();
    const [postMsg, setPostMsg] = useState<string | Error>('');
    const { submitRegistration } = useRegistrationApi();
    const navigation = useNavigation();
    const colorScheme = useColorScheme();
    useIntentListener();

    const { control, handleSubmit, reset } = useForm<RegistrationFormValues>({
        resolver: zodResolver(RegistrationSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
        },
    });

    const mutation = useMutation<string, Error, RegistrationSubmitForm>({
        mutationFn: (formData) => submitRegistration(registration?.domain || '', formData),
        onSuccess: () => {
            if (registration?.domain) {
                addUrl(registration.domain);
            }

            Alert.alert(
                t('misc_registration'),
                t('misc_registration_successful'),
                [
                    {
                        text: t('misc_close'),
                        onPress: () => {
                            handleClose();
                        },
                    },
                ],
                { cancelable: false }
            );
        },
        onError: (error) => {
            setPostMsg(error instanceof Error ? error.message : new Error(error));
        },
    });

    const onSubmit = async (data: RegistrationFormValues) => {
        setPostMsg('');
        const publicKey = await SecureStore.getItemAsync('deviceKey');
        if (publicKey) {
            const formData: RegistrationSubmitForm = {
                tokenId: registration?.tokenId || '',
                form: { ...data, publicKey, deviceId: appId },
            };
            mutation.mutate(formData);
        } else {
            setPostMsg(new Error('misc_public_key_missing'));
        }
    };

    useEffect(() => {
        const fetchKeys = async () => {
            try {
                const deviceKey = await SecureStore.getItemAsync('deviceKey');
                if (!deviceKey) {
                    const randomUuid = Crypto.randomUUID();
                    await SecureStore.setItemAsync('deviceKey', randomUuid);
                }
            } catch (error) {
                console.error("Error retrieving keys:", error);
            }
        };

        fetchKeys();
    }, []);

    useEffect(() => {
        if (registration) {
            const { employee } = registration;
            const fillForm = {
                name: employee?.name || '',
                email: employee?.email || '',
                phone: employee?.phone || '',
            };
            reset(fillForm);
        }
    }, [registration]);

    const handleClose = () => {
        setPostMsg('');
        setRegistration(null);
        navigation.navigate("(tabs)" as never);
        setIntent(null);
        queryClient.refetchQueries({ predicate: (query) => query.queryKey[0] === 'registrationForm' });
        queryClient.removeQueries({ queryKey: ['registrationForm'] });
    };

    return (
        <MainScreenLayout>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContainer}
                >
                    <ThemedView style={styles.container}>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <ThemedText style={[styles.closeButtonText, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
                                ×
                            </ThemedText>
                        </TouchableOpacity>

                        <ThemedText style={styles.title}>{t('misc_registration')}</ThemedText>

                        {!registration ? (
                            <ThemedView style={styles.container}>
                                <ThemedText style={styles.message}>{t('srv_no_data')}</ThemedText>
                            </ThemedView>
                        ) : (
                            <>
                                {registration.retail && (
                                    <ThemedView style={styles.inputContainer}>
                                        <ThemedText style={styles.label}>{t('misc_workplace')}:</ThemedText>
                                        <ThemedText style={styles.workplaceName}>{registration.retail.name}</ThemedText>
                                        <ThemedText>{registration.retail.address?.street}</ThemedText>
                                        <ThemedText>{registration.retail.address?.zip}, {registration.retail.address?.city}</ThemedText>
                                    </ThemedView>
                                )}
                                <Controller
                                    control={control}
                                    name="name"
                                    render={({ field: { onChange, onBlur, value }, fieldState }) => (
                                        <ThemedTextInput
                                            style={[fieldState.invalid && styles.inputError]}
                                            onBlur={onBlur}
                                            onChangeText={onChange}
                                            value={value}
                                            placeholder="Jan Novak"
                                            label={t('misc_full_name')}
                                            containerStyle={{ marginBottom: 20 }}
                                            error={fieldState.error?.message ? t(fieldState.error.message) : undefined}
                                        />
                                    )}
                                />

                                <Controller
                                    control={control}
                                    name="email"
                                    render={({ field: { onChange, onBlur, value }, fieldState }) => (
                                        <ThemedTextInput
                                            style={[fieldState.invalid && styles.inputError]}
                                            onBlur={onBlur}
                                            onChangeText={onChange}
                                            value={value}
                                            placeholder={t('misc_email')}
                                            label={t('misc_email')}
                                            keyboardType="email-address"
                                            containerStyle={{ marginBottom: 20 }}
                                            error={fieldState.error?.message ? t(fieldState.error.message) : undefined}
                                        />
                                    )}
                                />

                                <Controller
                                    control={control}
                                    name="phone"
                                    render={({ field: { onChange, onBlur, value }, fieldState }) => (
                                        <ThemedTextInput
                                            style={[fieldState.invalid && styles.inputError]}
                                            onBlur={onBlur}
                                            onChangeText={onChange}
                                            value={value}
                                            placeholder={'+420 123 456 789'}
                                            keyboardType="phone-pad"
                                            label={t('misc_telephone')}
                                            containerStyle={{ marginBottom: 20 }}
                                            error={fieldState.error?.message ? t(fieldState.error.message) : undefined}
                                        />
                                    )}
                                />

                                <ThemedView style={styles.inputContainer}>
                                    <ThemedText style={styles.label}>{t('misc_device_id')}</ThemedText>
                                    <ThemedText style={styles.label}>{appId}</ThemedText>
                                </ThemedView>

                                {mutation.isPending ? (
                                    <ThemedActivityIndicator />
                                ) : (
                                    <TouchableOpacity
                                        onPress={handleSubmit(onSubmit)}
                                        disabled={mutation.isPending || mutation.isSuccess}
                                        style={styles.setupButton}
                                    >
                                        <ThemedText type="link" style={styles.setupButtonText}>{t('misc_save')}</ThemedText>
                                    </TouchableOpacity>
                                )}

                                {postMsg && <FeedbackMessage message={postMsg} />}
                            </>
                        )}
                    </ThemedView>
                </ScrollView>
            </KeyboardAvoidingView>
        </MainScreenLayout>
    );
};

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        paddingHorizontal: 16,
        paddingTop: 10,
    },
    container: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 24,
        marginTop: 16,
        paddingHorizontal: 16,
        textAlign: 'center',
    },
    workplaceName: {
        fontSize: 18,
        fontWeight: '600',
    },
    inputContainer: {
        width: '100%',
        marginBottom: 20,
    },
    label: {
        fontSize: 15,
        fontWeight: '500',
        marginBottom: 6,
    },
    inputError: {
        borderColor: '#e63946',
    },
    errorText: {
        color: '#e63946',
        fontSize: 13,
        marginTop: 4,
    },
    message: {
        fontSize: 16,
        color: 'gray',
        textAlign: 'center',
        marginVertical: 20,
    },
    setupButton: {
        marginTop: 20,
        alignSelf: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: '#1d3557',
        borderRadius: 8,
    },
    setupButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '600',
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
    },
    closeButtonText: {
        fontSize: 28,
        fontWeight: '600',
        padding: 4,
    },
});

export default RegistrationScreen;
