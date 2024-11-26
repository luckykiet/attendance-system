import React, { useEffect, useState, ReactNode } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import { authenticate, getBiometricPreference } from '@/utils';
import useTranslation from '@/hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import ThemedText from '@/components/theme/ThemedText';
import * as LocalAuthentication from 'expo-local-authentication';

interface AppLockProps {
    children: ReactNode;
}

const AppLock: React.FC<AppLockProps> = ({ children }) => {
    const { t } = useTranslation();
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [authFailed, setAuthFailed] = useState(false);

    const openAppSettings = () => {
        Linking.openSettings().catch(() => {
            Alert.alert(
                t('misc_error'),
                t('misc_unable_to_open_settings')
            );
        });
    };

    const checkAuthentication = async () => {
        setIsChecking(true);
        setAuthFailed(false);

        try {
            const biometricEnabled = await getBiometricPreference();
            if (biometricEnabled) {
                const hasHardware = await LocalAuthentication.hasHardwareAsync();
                const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
                const isEnrolled = await LocalAuthentication.isEnrolledAsync();

                if (!hasHardware || supportedTypes.length === 0 || !isEnrolled) {
                    Alert.alert(
                        t('srv_permission_required'),
                        t('srv_biometric_disabled'),
                        [
                            {
                                text: t('misc_enable_in_settings'),
                                onPress: openAppSettings,
                            },
                            { text: t('misc_cancel'), style: 'cancel' },
                        ]
                    );
                    setIsAuthenticated(false);
                } else {
                    const authResult = await authenticate(t);
                    setIsAuthenticated(authResult.success);

                    if (!authResult.success) {
                        setAuthFailed(true);
                    }
                }
            } else {
                setIsAuthenticated(true);
            }
        } catch (error) {
            setAuthFailed(true);
            setIsAuthenticated(false);
        } finally {
            setIsChecking(false);
        }
    };

    useEffect(() => {
        checkAuthentication();
    }, []);

    if (isChecking) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={isDarkMode ? '#fff' : '#000'} />
            </View>
        );
    }

    if (!isAuthenticated) {
        return (
            <View style={styles.centered}>
                {authFailed ? (
                    <>
                        <Text style={[styles.errorText, { color: isDarkMode ? '#ff6b6b' : 'red' }]}>
                            {t('srv_authentication_failed')}
                        </Text>
                        <TouchableOpacity
                            style={[
                                styles.retryButton,
                                { backgroundColor: isDarkMode ? '#444' : '#007BFF' },
                            ]}
                            onPress={checkAuthentication}
                        >
                            <Ionicons name="finger-print" size={24} color={'#fff'} />
                            <Text
                                style={[
                                    styles.retryButtonText,
                                    { color: '#fff' },
                                ]}
                            >
                                {t('misc_unlock')}
                            </Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <ThemedText>{t('srv_biometric_required')}</ThemedText>
                        <ThemedText>{t('misc_enable_in_settings')}</ThemedText>
                        <TouchableOpacity style={styles.permissionButton} onPress={openAppSettings}>
                            <ThemedText style={styles.permissionButtonText}>{t('misc_grant_permission')}</ThemedText>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        );
    }

    return <>{children}</>;
};

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        marginBottom: 10,
        fontSize: 16,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    retryButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    icon: {
        marginRight: 10,
    },
    permissionButton: {
        alignSelf: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#e63946',
        borderRadius: 5,
    },
    permissionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default AppLock;
