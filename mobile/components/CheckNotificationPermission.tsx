import { TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import ThemedText from '@/components/theme/ThemedText';
import ThemedView from '@/components/theme/ThemedView';
import useTranslation from '@/hooks/useTranslation';

const CheckNotificationPermission = () => {
    const { t } = useTranslation();
    const [notificationStatus, setNotificationStatus] = useState<'granted' | 'denied' | 'undetermined'>('granted');

    const openAppSettings = () => {
        Linking.openSettings().catch(() => {
            Alert.alert(
                t('misc_error'),
                t('misc_unable_to_open_settings')
            );
        });
    };
    const checkNotificationPermission = async () => {
        const { status } = await Notifications.getPermissionsAsync();
        setNotificationStatus(status);
    };

    const requestNotificationPermission = async () => {
        const { status } = await Notifications.requestPermissionsAsync();
        setNotificationStatus(status);
        if (status === 'denied') {
            openAppSettings();
        }
    };

    useEffect(() => {
        checkNotificationPermission();
    }, []);

    if (notificationStatus === 'granted') {
        return null;
    }
    return (
        <ThemedView style={styles.notificationBox}>
            <ThemedText style={styles.notificationText}>
                {t('misc_enable_notification_to_receive_shift_reminders')}
            </ThemedText>
            <TouchableOpacity style={styles.button} onPress={requestNotificationPermission}>
                <ThemedText style={styles.buttonText}>{t('misc_enable_notifications')}</ThemedText>
            </TouchableOpacity>
        </ThemedView>
    )
}

const styles = StyleSheet.create({
    notificationBox: {
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
    },
    notificationText: {
        fontSize: 14,
        marginBottom: 10,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#457b9d',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 15,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default CheckNotificationPermission