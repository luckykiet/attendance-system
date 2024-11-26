import React, { useEffect, useState, ReactNode } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { authenticate, getBiometricPreference } from '@/utils';
import useTranslation from '@/hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import ThemedText from '@/components/theme/ThemedText';

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

    const checkAuthentication = async () => {
        setIsChecking(true);
        setAuthFailed(false);

        try {
            const biometricEnabled = await getBiometricPreference();
            if (biometricEnabled) {
                const authResult = await authenticate(t);
                setIsAuthenticated(authResult.success);

                if (!authResult.success) {
                    setAuthFailed(true);
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
                    <ThemedText>{t('srv_authentication_required')}</ThemedText>
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
});

export default AppLock;
