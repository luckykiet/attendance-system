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
import _ from 'lodash';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { useRegistrationApi } from '@/api/useRegistrationApi';
import { RegistrationSubmitForm } from '@/types/registration';
import { useNavigation } from 'expo-router';
import useIntentListener from '@/hooks/useIntentListener';

const RegistrationSchema = z.object({
    name: z.string().min(1, 'misc_required'),
    email: z.string().email('srv_invalid_email'),
    phone: z.string().min(7, 'srv_invalid_phone').optional().or(z.literal('')),
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
                <ScrollView contentContainerStyle={styles.scrollContainer}>
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

                                <ThemedView style={styles.inputContainer}>
                                    <ThemedText style={styles.label}>{t('misc_full_name')}</ThemedText>
                                    <Controller
                                        control={control}
                                        name="name"
                                        render={({ field: { onChange, onBlur, value }, fieldState }) => (
                                            <>
                                                <ThemedTextInput
                                                    style={[styles.input, fieldState.invalid && styles.inputError]}
                                                    onBlur={onBlur}
                                                    onChangeText={onChange}
                                                    value={value}
                                                    placeholder="Jan Novak"
                                                />
                                                {fieldState.invalid && !_.isEmpty(fieldState.error?.message) && (
                                                    <ThemedText style={styles.errorText}>{t(fieldState.error?.message || '')}</ThemedText>
                                                )}
                                            </>
                                        )}
                                    />
                                </ThemedView>

                                <ThemedView style={styles.inputContainer}>
                                    <ThemedText style={styles.label}>{t('misc_email')}</ThemedText>
                                    <Controller
                                        control={control}
                                        name="email"
                                        render={({ field: { onChange, onBlur, value }, fieldState }) => (
                                            <>
                                                <ThemedTextInput
                                                    style={[styles.input, fieldState.invalid && styles.inputError]}
                                                    onBlur={onBlur}
                                                    onChangeText={onChange}
                                                    value={value}
                                                    placeholder={t('misc_email')}
                                                    keyboardType="email-address"
                                                />
                                                {fieldState.invalid && !_.isEmpty(fieldState.error?.message) && (
                                                    <ThemedText style={styles.errorText}>{t(fieldState.error?.message || '')}</ThemedText>
                                                )}
                                            </>
                                        )}
                                    />
                                </ThemedView>

                                <ThemedView style={styles.inputContainer}>
                                    <ThemedText style={styles.label}>{t('misc_telephone')}</ThemedText>
                                    <Controller
                                        control={control}
                                        name="phone"
                                        render={({ field: { onChange, onBlur, value }, fieldState }) => (
                                            <>
                                                <ThemedTextInput
                                                    style={[styles.input, fieldState.invalid && styles.inputError]}
                                                    onBlur={onBlur}
                                                    onChangeText={onChange}
                                                    value={value}
                                                    placeholder={'+420 123 456 789'}
                                                    keyboardType="phone-pad"
                                                />
                                                {fieldState.invalid && !_.isEmpty(fieldState.error?.message) && (
                                                    <ThemedText style={styles.errorText}>{t(fieldState.error?.message || '')}</ThemedText>
                                                )}
                                            </>
                                        )}
                                    />
                                </ThemedView>

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
        padding: 16,
    },
    container: {
        flex: 1,
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    workplaceName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    inputContainer: {
        width: '100%',
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        marginBottom: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 8,
        borderRadius: 4,
    },
    inputError: {
        borderColor: 'red',
    },
    errorText: {
        color: 'red',
        fontSize: 14,
        marginTop: 4,
    },
    message: {
        fontSize: 16,
        color: 'gray',
    },
    setupButton: {
        alignSelf: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#457b9d',
        borderRadius: 5,
        marginBottom: 15,
    },
    setupButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
        padding: 8,
    },
    closeButtonText: {
        fontSize: 28,
        fontWeight: 'bold',
    },
});

export default RegistrationScreen;
