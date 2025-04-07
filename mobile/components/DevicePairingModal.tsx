import {
    StyleSheet,
    TouchableOpacity,
    Modal,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    View,
    Alert,
} from 'react-native';

import ThemedView from '@/components/theme/ThemedView';
import ThemedText from '@/components/theme/ThemedText';
import ThemedTextInput from '@/components/theme/ThemedTextInput';
import useTranslation from '@/hooks/useTranslation';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppStore } from '@/stores/useAppStore';
import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRegistrationApi } from '@/api/useRegistrationApi';
import { useNavigation } from 'expo-router';

interface DevicePairingModalProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const RegistrationSchema = z.object({
    domain: z.string().min(1, 'misc_required').url('srv_invalid_url'),
    tokenId: z.string().min(1, 'misc_required'),
});

type RegistrationFormValues = z.infer<typeof RegistrationSchema>;

const DevicePairingModal = ({ isOpen, setIsOpen }: DevicePairingModalProps) => {
    const { t } = useTranslation();
    const { intent, setIntent, setRegistration } = useAppStore();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const navigation = useNavigation();

    const { getRegistration } = useRegistrationApi();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const { control, setValue, handleSubmit, reset } = useForm<RegistrationFormValues>({
        resolver: zodResolver(RegistrationSchema),
        defaultValues: {
            domain: '',
            tokenId: '',
        },
        mode: 'all',
    });

    const registrationFormMutation = useMutation({
        mutationFn: ({ domain, tokenId }: { domain: string, tokenId: string }) =>
            getRegistration(domain, tokenId),
        onSuccess: (registrationForm, variables) => {
            setRegistration({
                ...registrationForm,
                domain: variables.domain,
                tokenId: variables.tokenId,
            });
            setIntent(null);
            setIsOpen(false);
            navigation.navigate("(hidden)/registration" as never);
        },
        onError: (error) => {
            const errorMessage = typeof error === 'string' ? error === 'Unknown error' ? 'srv_failed_to_connect_to_server' : error : error.message ? error.message === 'Unknown error' ? 'srv_failed_to_connect_to_server' : error.message : 'misc_error';
            setErrorMessage(errorMessage);
        },
    });

    const handleManualSubmit = (data: RegistrationFormValues) => {
        registrationFormMutation.mutate(data);
    };

    useEffect(() => {
        if (intent) {
            setValue('domain', intent.domain);
            setValue('tokenId', intent.tokenId);
        } else {
            reset();
        }
    }, [intent]);

    useEffect(() => {
        if (errorMessage) {
            Alert.alert(t('misc_error'), t(errorMessage));
            setErrorMessage(null);
        }
    }, [errorMessage]);

    return (
        <Modal
            visible={isOpen}
            transparent
            animationType="slide"
            onRequestClose={() => setIsOpen(false)}
        >
            <KeyboardAvoidingView
                style={styles.modalOverlay}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={styles.centered}>
                    <ScrollView contentContainerStyle={styles.scrollContainer}>
                        <ThemedView
                            style={[
                                styles.modalContent,
                                isDark ? styles.modalDark : styles.modalLight,
                            ]}
                        >
                            <ThemedText style={styles.modalTitle}>
                                {t('misc_device_registration')}
                            </ThemedText>

                            <View style={styles.inputContainer}>
                                <ThemedText style={styles.label}>{t('misc_domain')}</ThemedText>
                                <Controller
                                    control={control}
                                    name="domain"
                                    render={({ field: { onChange, onBlur, value }, fieldState }) => (
                                        <>
                                            <ThemedTextInput
                                                onChangeText={onChange}
                                                onBlur={onBlur}
                                                value={value}
                                                placeholder={`${t('misc_enter_url')}...`}
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                                style={styles.input}
                                            />
                                            {fieldState.invalid && fieldState.error?.message && (
                                                <ThemedText style={styles.errorText}>
                                                    {t(fieldState.error?.message)}
                                                </ThemedText>
                                            )}
                                        </>
                                    )}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <ThemedText style={styles.label}>{t('misc_token')}</ThemedText>
                                <Controller
                                    control={control}
                                    name="tokenId"
                                    render={({ field: { onChange, onBlur, value }, fieldState }) => (
                                        <>
                                            <ThemedTextInput
                                                onChangeText={onChange}
                                                onBlur={onBlur}
                                                value={value}
                                                placeholder={`${t('misc_enter_token')}...`}
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                                style={styles.input}
                                            />
                                            {fieldState.invalid && fieldState.error?.message && (
                                                <ThemedText style={styles.errorText}>
                                                    {t(fieldState.error?.message)}
                                                </ThemedText>
                                            )}
                                        </>
                                    )}
                                />
                            </View>

                            <View style={styles.buttonRow}>
                                <TouchableOpacity
                                    style={[styles.button, styles.submitButton]}
                                    onPress={handleSubmit(handleManualSubmit)}
                                    disabled={registrationFormMutation.isPending}
                                >
                                    <ThemedText style={styles.submitButtonText}>
                                        {t('misc_submit')}
                                    </ThemedText>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.button, styles.cancelButton]}
                                    onPress={() => setIsOpen(false)}
                                >
                                    <ThemedText style={styles.cancelButtonText}>
                                        {t('misc_cancel')}
                                    </ThemedText>
                                </TouchableOpacity>
                            </View>
                        </ThemedView>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    modalContent: {
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 5,
    },
    modalLight: {
        backgroundColor: '#fff',
    },
    modalDark: {
        backgroundColor: '#1e1e1e',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
        textAlign: 'center',
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
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    submitButton: {
        backgroundColor: '#457b9d',
        marginRight: 8,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    cancelButton: {
        backgroundColor: '#ccc',
        marginLeft: 8,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    errorText: {
        color: 'red',
        fontSize: 14,
        marginTop: 4,
    },
});

export default DevicePairingModal;
