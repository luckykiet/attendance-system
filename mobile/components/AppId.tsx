import React from 'react';
import { StyleSheet, Alert, TouchableOpacity } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import ThemedView from '@/components/theme/ThemedView';
import ThemedText from '@/components/theme/ThemedText';
import { useAppStore } from '@/stores/useAppStore';
import useTranslation from '@/hooks/useTranslation';

export const AppId = () => {
    const { t } = useTranslation();
    const { appId } = useAppStore();

    const handleCopyToClipboard = () => {
        if (appId) {
            Clipboard.setStringAsync(appId);
            Alert.alert(t('misc_copied_to_clipboard'), t('misc_app_id_copied'));
        }
    };

    return (
        <TouchableOpacity onPress={handleCopyToClipboard}>
            <ThemedView style={styles.appIdContainer}>
                <ThemedText type="subtitle" style={styles.appIdLabel}>{t('misc_app_id')}:</ThemedText>
                <ThemedText type="default" style={styles.appIdText}>{appId}</ThemedText>
            </ThemedView>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    appIdContainer: {
        alignItems: 'center',
        marginTop: 'auto',
        padding: 10,
    },
    appIdLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    appIdText: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 5,
        opacity: 0.7,
    },
});
