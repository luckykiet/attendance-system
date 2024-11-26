import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, Alert, Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useColorScheme } from '@/hooks/useColorScheme';
import useTranslation from '@/hooks/useTranslation';

export const BiometricSwitcher: React.FC = () => {
    const { t } = useTranslation();
    const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';

    const biometricType = Platform.OS === 'ios' ? 'Face ID / Touch ID' : 'Fingerprint';

    useEffect(() => {
        const loadBiometricPreference = async () => {
            const storedValue = await SecureStore.getItemAsync('biometricEnabled');
            setIsBiometricEnabled(storedValue === 'true');
        };
        loadBiometricPreference();
    }, []);

    const toggleBiometric = async () => {
        if (!isBiometricEnabled) {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

            if (!hasHardware || supportedTypes.length === 0) {
                Alert.alert(t('misc_error'), t('srv_no_biometric_supported'));
                return;
            }

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: `${'misc_enable'} ${biometricType}`,
                cancelLabel: t('misc_cancel'),
            });

            if (result.success) {
                await SecureStore.setItemAsync('biometricEnabled', 'true');
                setIsBiometricEnabled(true);
            } else {
                Alert.alert(t('srv_authentication_failed'), t(result.error || 'srv_unknown_error'));
            }
        } else {
            await SecureStore.setItemAsync('biometricEnabled', 'false');
            setIsBiometricEnabled(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={[styles.label, { color: isDarkMode ? '#fff' : '#000' }]}>
                {biometricType}
            </Text>
            <Switch value={isBiometricEnabled} onValueChange={toggleBiometric} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    label: {
        fontSize: 16,
        marginRight: 10,
    },
});
