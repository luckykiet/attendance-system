import React, { useEffect, useState } from 'react';
import { Modal, View, StyleSheet, Linking, Alert } from 'react-native';
import { checkVersion } from 'react-native-check-version';
import Constants from 'expo-constants';
import { isAndroid, androidPackage } from '@/utils';
import ThemedText from '@/components/theme/ThemedText';

import { MaterialIcons } from '@expo/vector-icons';
import useTranslation from '@/hooks/useTranslation';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import ThemedButton from './theme/ThemedButton';

const VersionCheck = () => {
    const [updateModalVisible, setUpdateModalVisible] = useState(false);
    const { t } = useTranslation();
    const colorScheme = useColorScheme() ?? 'light';

    const styles = createStyles(colorScheme);

    useEffect(() => {
        checkVersion({
            bundleId: androidPackage,
            currentVersion: Constants.expoConfig?.version || '1.0.0',
        }).then((resp) => {
            if (resp.needsUpdate) {
                if (resp.updateType === 'major') {
                    setUpdateModalVisible(true);
                } else {
                    showOptionalUpdateAlert();
                }
            }
        });
    }, []);

    const showOptionalUpdateAlert = () => {
        Alert.alert(
            t('misc_info'),
            t('misc_update_available_text'),
            [
                { text: t('misc_cancel') },
                { text: t('misc_confirm'), onPress: handleUpdate },
            ],
            { cancelable: true }
        );
    };

    const handleUpdate = () => {
        const storeUrl = isAndroid
            ? Constants.expoConfig?.android?.playStoreUrl
            : Constants.expoConfig?.ios?.appStoreUrl;
        if (storeUrl) {
            Linking.openURL(storeUrl).catch(() => {
                Alert.alert(t('misc_error'), t('misc_store_error'));
            });
        }
    };

    return (
        <Modal visible={updateModalVisible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <MaterialIcons name="system-update" size={50} color={Colors.primary} />
                    <ThemedText type="title" style={styles.title}>
                        {t('misc_update_required')}
                    </ThemedText>
                    <ThemedText style={styles.message}>
                        {t('misc_major_update_text')}
                    </ThemedText>
                    <ThemedButton
                        title={t('misc_update_now')}
                        icon="file-download"
                        onPress={handleUpdate}
                        style={styles.updateButton}
                    />
                </View>
            </View>
        </Modal>
    );
};

const createStyles = (colorScheme: string) =>
    StyleSheet.create({
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
        },
        modalContent: {
            backgroundColor: colorScheme === 'dark' ? '#333' : '#fff',
            borderRadius: 20,
            padding: 30,
            alignItems: 'center',
            width: '90%',
        },
        title: {
            fontSize: 22,
            fontWeight: 'bold',
            marginVertical: 15,
            textAlign: 'center',
        },
        message: {
            fontSize: 16,
            textAlign: 'center',
            lineHeight: 22,
            marginBottom: 20,
        },
        updateButton: {
            width: '100%',
            marginTop: 10,
        },
    });

export default VersionCheck;
