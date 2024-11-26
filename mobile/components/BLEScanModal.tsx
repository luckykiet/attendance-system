import React, { useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    FlatList,
    Modal,
    TouchableOpacity,
    useColorScheme,
    Alert,
} from 'react-native';
import ThemedText from '@/components/theme/ThemedText';
import useTranslation from '@/hooks/useTranslation';
import useBLEScanner from '@/hooks/useBLEScanner';
import { useAppStore } from '@/stores/useAppStore';
import ThemedActivityIndicator from './theme/ThemedActivityIndicator';
import ThemedView from './theme/ThemedView';

interface BLEScanModalProps {
    onClose?: () => void;
    onResult: (result: boolean, foundDevices: string[]) => void;
}

const BLEScanModal: React.FC<BLEScanModalProps> = ({
    onClose,
    onResult,
}) => {
    const { localDevices, setLocalDevices } = useAppStore();
    const { t } = useTranslation();
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';
    const {
        scan,
        isScanning,
        isSuccess,
        isError,
        errors,
        foundDevices,
        rescan,
    } = useBLEScanner();

    const callbackInvoked = useRef(false);

    const handleStartScan = () => {
        callbackInvoked.current = false;
        scan(localDevices);
    };

    const handleClose = () => {
        if (onClose) {
            onClose();
        }
        if(foundDevices.length <= 0 && !callbackInvoked.current) {
            onResult(false, [])
            Alert.alert(t('srv_scan_failed'), t('srv_device_not_found'));
        }
        setLocalDevices([]);
        callbackInvoked.current = false;
    };

    useEffect(() => {
        if (localDevices.length > 0) {
            handleStartScan();
        }
    }, [localDevices]);

    useEffect(() => {
        if (isSuccess && foundDevices.length > 0 && !callbackInvoked.current) {
            callbackInvoked.current = true; 
            setTimeout(() => {
                onResult(true, foundDevices);
                setLocalDevices([]);
            }, 500);
        }
    }, [isSuccess, foundDevices, onResult, setLocalDevices]);


    return (
        <Modal
            visible={localDevices.length > 0}
            animationType="slide"
            onRequestClose={handleClose}
            transparent={true}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, isDarkMode && styles.modalContentDark]}>
                    <ThemedText type="title" style={[styles.modalTitle, isDarkMode && styles.modalTitleDark]}>
                        {t('misc_scanning_local_devices')}
                    </ThemedText>
                    {isScanning ? (
                        <ThemedActivityIndicator size={'large'} />
                    ) : (
                        <>

                            {isError && (
                                <ThemedText style={[styles.error, isDarkMode && styles.errorDark]}>
                                    {t(errors || 'srv_scan_error')}
                                </ThemedText>
                            )}
                            {isSuccess && (
                                <ThemedText style={[styles.success, isDarkMode && styles.successDark]}>
                                    {t('srv_device_not_found')}
                                </ThemedText>
                            )}

                            <FlatList
                                data={foundDevices}
                                keyExtractor={(item) => item}
                                renderItem={({ item }) => (
                                    <View style={[styles.device, isDarkMode && styles.deviceDark]}>
                                        <ThemedText>
                                            {item || t('misc_unknown_device')}
                                        </ThemedText>
                                        <ThemedText>{item}</ThemedText>
                                    </View>
                                )}
                                ListEmptyComponent={
                                    <ThemedText style={[styles.empty, isDarkMode && styles.emptyDark]}>
                                        {t('srv_device_not_found')}
                                    </ThemedText>
                                }
                            />

                            <TouchableOpacity
                                style={[styles.button, isDarkMode && styles.buttonDark]}
                                onPress={rescan}
                                disabled={isScanning}
                            >
                                <ThemedText style={[styles.buttonText, isDarkMode && styles.buttonTextDark]}>
                                    {t('misc_rescan')}
                                </ThemedText>
                            </TouchableOpacity>
                        </>
                    )}

                    <TouchableOpacity
                        style={[styles.button, styles.closeButton, isDarkMode && styles.closeButtonDark]}
                        onPress={handleClose}
                        disabled={isScanning}
                    >
                        <ThemedText style={[styles.buttonText, isDarkMode && styles.buttonTextDark]}>
                            {t('misc_close')}
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 10,
        elevation: 5,
    },
    modalContentDark: {
        backgroundColor: '#333',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 15,
        color: '#000',
    },
    modalTitleDark: {
        color: '#fff',
    },
    device: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    deviceDark: {
        borderBottomColor: '#555',
    },
    error: {
        color: 'red',
        textAlign: 'center',
        marginVertical: 10,
    },
    errorDark: {
        color: '#ff6b6b',
    },
    success: {
        color: 'green',
        textAlign: 'center',
        marginVertical: 10,
    },
    successDark: {
        color: '#4caf50',
    },
    empty: {
        textAlign: 'center',
        marginVertical: 20,
        color: '#888',
    },
    emptyDark: {
        color: '#bbb',
    },
    button: {
        backgroundColor: '#457b9d',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        alignItems: 'center',
        marginVertical: 10,
    },
    buttonDark: {
        backgroundColor: '#1e6091',
    },
    closeButton: {
        backgroundColor: '#e63946',
    },
    closeButtonDark: {
        backgroundColor: '#b71c1c',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonTextDark: {
        color: '#eee',
    },
});

export default BLEScanModal;
