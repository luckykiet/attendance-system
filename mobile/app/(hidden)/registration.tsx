import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
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

const RegistrationSchema = z.object({
    name: z.string().min(1, 'misc_required'),
    email: z.string().email('srv_invalid_email'),
    phone: z.string().min(7, 'srv_invalid_phone').optional().or(z.literal('')),
});

type RegistrationFormValues = z.infer<typeof RegistrationSchema>;

const RegistrationScreen: React.FC = () => {
    const { t } = useTranslation();
    const { registration, appId, addUrl, setRegistration } = useAppStore();
    const [postMsg, setPostMsg] = useState<string | Error>('');
    const { submitRegistration } = useRegistrationApi();
    const navigation = useNavigation();

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
            setRegistration(null);
            navigation.navigate("(tabs)" as never);
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

    if (!registration) {
        return (
            <View style={styles.container}>
                <ThemedText style={styles.message}>{t('srv_no_data')}</ThemedText>
            </View>
        );
    }

    return (
        <MainScreenLayout>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <ThemedView style={styles.container}>
                        <ThemedText style={styles.title}>{t('misc_registration')}</ThemedText>
                        {registration.retail && (
                            <ThemedView style={styles.inputContainer}>
                                <ThemedText style={styles.label}>{t('misc_workplace')}:</ThemedText>
                                <ThemedText>{registration.retail.name}</ThemedText>
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
                                        {fieldState.invalid && !_.isEmpty(fieldState.error?.message) && <ThemedText style={styles.errorText}>{fieldState.error?.message}</ThemedText>}
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
                                        {fieldState.invalid && !_.isEmpty(fieldState.error?.message) && <ThemedText style={styles.errorText}>{fieldState.error?.message}</ThemedText>}
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
                                            placeholder={t('misc_telephone')}
                                            keyboardType="phone-pad"
                                        />
                                        {fieldState.invalid && !_.isEmpty(fieldState.error?.message) && <ThemedText style={styles.errorText}>{fieldState.error?.message}</ThemedText>}
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
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: 'blue',
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
});

export default RegistrationScreen;
