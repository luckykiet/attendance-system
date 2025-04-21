import React, { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { StyleSheet, TouchableOpacity, Alert, Linking, View } from 'react-native';

import ThemedText from '@/components/theme/ThemedText';
import useTranslation from '@/hooks/useTranslation';
import { useAppStore } from '@/stores/useAppStore';
import ThemedActivityIndicator from '@/components/theme/ThemedActivityIndicator';

const COOLDOWN_PERIOD = 3000;

export const LocationRequest = () => {
    const { t } = useTranslation();
    const { location, setLocation, isGettingLocation, setIsGettingLocation } = useAppStore();
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [isCooldown, setIsCooldown] = useState(false);

    const getLocation = async () => {
        setIsGettingLocation(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            setPermissionDenied(true);
            Alert.alert(
                t('misc_permission_denied'),
                t('srv_location_required_to_make_attendance')
            );
            setIsGettingLocation(false);
            return;
        }
        setPermissionDenied(false);
        const { coords } = await Location.getCurrentPositionAsync({});
        setLocation({ latitude: coords.latitude, longitude: coords.longitude });
        setIsGettingLocation(false);
    };

    const openAppSettings = () => {
        Linking.openSettings().catch(() => {
            Alert.alert(
                t('misc_error'),
                t('misc_unable_to_open_settings')
            );
        });
    };

    const handleRefreshLocation = () => {
        if (isCooldown) return;
        setIsCooldown(true);
        getLocation();
        setTimeout(() => setIsCooldown(false), COOLDOWN_PERIOD);
    };

    useEffect(() => {
        getLocation();
    }, []);

    if (permissionDenied) {
        return (
            <TouchableOpacity style={styles.permissionButton} onPress={openAppSettings}>
                <ThemedText style={styles.permissionButtonText}>{t('misc_grant_location_permission')}</ThemedText>
            </TouchableOpacity>
        );
    }

    return (
        <View style={styles.locationContainer}>
            {location ? (
                <TouchableOpacity
                    disabled={isGettingLocation || isCooldown}
                    style={[
                        styles.refreshButton,
                        (isGettingLocation || isCooldown) && styles.refreshButtonLoading
                    ]}
                    onPress={handleRefreshLocation}
                >
                    <ThemedText style={styles.refreshButtonText}>{t('misc_refresh_location')}</ThemedText>
                </TouchableOpacity>
            ) : <ThemedActivityIndicator size={'large'} />}
        </View>
    );
};

const styles = StyleSheet.create({
    locationContainer: {
        alignItems: 'center',
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
    refreshButton: {
        alignSelf: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#007bff',
        borderRadius: 5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    refreshButtonLoading: {
        backgroundColor: '#0056b3',
    },
    refreshButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
