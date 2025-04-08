import { Ionicons } from '@expo/vector-icons';
import { useRegistrationApi } from '@/api/useRegistrationApi';
import useTranslation from '@/hooks/useTranslation';
import { useAppStore } from '@/stores/useAppStore';
import { delay, isValidUrl, parseAttendanceUrl } from '@/utils';
import { useMutation } from '@tanstack/react-query';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from 'expo-router';
import ThemedText from './theme/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import ThemedView from './theme/ThemedView';

export default function CameraScanner() {
    const { t } = useTranslation();
    const [facing, setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const { getRegistration } = useRegistrationApi();
    const { setRegistration, intent, setIntent } = useAppStore();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [lastScannedItem, setLastScannedItem] = useState<string | null>(null);
    const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
    const [scanLocked, setScanLocked] = useState<boolean>(false);

    const navigation = useNavigation();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    useFocusEffect(
        useCallback(() => {
            setIsCameraActive(true);
            return () => setIsCameraActive(false);
        }, [])
    );

    const openAppSettings = () => {
        Linking.openSettings().catch(() => {
            Alert.alert(
                t('misc_error'),
                t('misc_unable_to_open_settings')
            );
        });
    };

    const registrationFormMutation = useMutation({
        mutationFn: ({ domain, tokenId }: { domain: string, tokenId: string }) =>
            getRegistration(domain, tokenId),
        onSuccess: (registrationForm, variables) => {
            setRegistration({ ...registrationForm, tokenId: variables.tokenId, domain: variables.domain });
            navigation.navigate("(hidden)/registration" as never);
            handleClearScannedItem();
        },
        onError: (error) => {
            const errorMessage = typeof error === 'string' ? error === 'Unknown error' ? 'srv_failed_to_connect_to_server' : error : error.message ? error.message === 'Unknown error' ? 'srv_failed_to_connect_to_server' : error.message : 'misc_error';
            setErrorMessage(errorMessage);
            registrationFormMutation.reset();
        }
    });

    const toggleCameraFacing = () => {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    }

    const handleBarCodeScanned = async ({ data }: { data: string }) => {
        if (scanLocked || data === lastScannedItem) return;

        setLastScannedItem(data);
        setScanLocked(true);
        setIntent(null);

        const parsedData = parseAttendanceUrl(data);
        if (parsedData.params.domain && parsedData.params.tokenId) {
            const intentObj = {
                path: parsedData.path,
                domain: parsedData.params.domain,
                tokenId: parsedData.params.tokenId,
            };
            
            setIntent(intentObj);
            if (registrationFormMutation.isIdle) {
                registrationFormMutation.mutate({
                    domain: intentObj.domain,
                    tokenId: intentObj.tokenId,
                });
            }

        } else if (isValidUrl(data)) {
            Linking.openURL(data);
        }

        await delay(2000);
        setScanLocked(false);
    };

    const handleClearScannedItem = () => {
        setLastScannedItem(null);
        setIntent(null);
        setScanLocked(false);
        registrationFormMutation.reset();
    }

    useEffect(() => {
        if (errorMessage) {
            Alert.alert(
                t('misc_error'),
                t(errorMessage)
            );
            setErrorMessage(null);
        }
    }, [errorMessage]);

    useEffect(() => {
        if (!permission) {
            requestPermission();
        }
    }, [permission]);

    if (!permission) {
        return <View />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <ThemedText style={styles.message}>{t('misc_need_camera_permission_to_scan')}</ThemedText>
                <ThemedText style={styles.message}>{t('misc_allow_camera_permission_to_do_registration')}</ThemedText>
                <TouchableOpacity style={styles.permissionButton} onPress={openAppSettings}>
                    <ThemedText style={styles.permissionButtonText}>{t('misc_grant_permission')}</ThemedText>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[
            styles.container,
            styles.outer,
            isDark ? styles.darkBackground : styles.lightBackground
        ]}>
            {isCameraActive && (
                <CameraView
                    style={[
                        styles.camera,
                        styles.inner,
                        isDark ? styles.darkBackground : styles.lightBackground
                    ]}
                    facing={facing}
                    onBarcodeScanned={handleBarCodeScanned}
                    barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                >
                    {registrationFormMutation.isPending ? (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color="#fff" />
                            <ThemedText style={styles.loadingText}>{t('misc_loading_data')}</ThemedText>
                        </View>
                    ) : (
                        <View style={styles.qrOverlay}>
                            <View style={[
                                styles.qrFrame,
                                isDark ? styles.darkShadow : styles.lightShadow,
                            ]} />
                            <ThemedText style={styles.qrMessage}>{t('misc_align_camera_to_qr_code')}</ThemedText>
                        </View>
                    )}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
                            <Ionicons name="camera-reverse" size={30} color="white" />
                        </TouchableOpacity>
                    </View>
                </CameraView>
            )}
            {(lastScannedItem || intent) && (
                <ThemedView style={styles.scannedItemContainer}>
                    {intent ? (
                        <View style={{ flex: 1 }}>
                            <ThemedText style={styles.scannedItemData}>
                                {t('misc_domain')}: {intent.domain}
                            </ThemedText>
                            <ThemedText style={styles.scannedItemData}>
                                {t('misc_token')}: {intent.tokenId}
                            </ThemedText>
                        </View>
                    ) : (
                        <ThemedText style={styles.scannedItemData}>{lastScannedItem}</ThemedText>
                    )}
                    <TouchableOpacity onPress={handleClearScannedItem}>
                        <Ionicons name="close-circle" size={24} color="gray" />
                    </TouchableOpacity>
                </ThemedView>
            )}
            <ThemedText style={styles.message}>{t('misc_camera_to_do_registration')}</ThemedText>
        </View>
    );
}

const OUTER_RADIUS = 16;
const PADDING = 8;
const INNER_RADIUS = OUTER_RADIUS - PADDING;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
    },
    message: {
        textAlign: 'center',
        paddingBottom: 10,
    },
    outer: {
        borderRadius: OUTER_RADIUS,
        padding: PADDING,
    },
    inner: {
        borderRadius: INNER_RADIUS,
    },
    darkBackground: {
        backgroundColor: '#000',
    },
    lightBackground: {
        backgroundColor: '#94a3b8',
    },
    darkBorder: {
        borderColor: '#94a3b8',
        borderWidth: 1,
    },
    lightBorder: {
        borderColor: '#000',
        borderWidth: 1,
    },
    darkShadow: {
        shadowColor: '#222',
    },
    lightShadow: {
        shadowColor: '#999',
    },
    camera: {
        flex: 1,
    },
    buttonContainer: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'transparent',
        margin: 64,
    },
    button: {
        flex: 1,
        alignSelf: 'flex-end',
        alignItems: 'center',
    },
    qrOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    qrFrame: {
        width: 240,
        height: 240,
        borderWidth: 3,
        borderRadius: 20,
        backgroundColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 6,
        elevation: 8,
        borderColor: '#fff',
    },
    qrMessage: {
        marginTop: 10,
        fontSize: 18,
        textAlign: 'center',
        color: '#fff',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: 'white',
        fontSize: 16,
    },
    scannedItemContainer: {
        display: 'flex',
        padding: 14,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    scannedItemData: {
        fontSize: 14,
        color: '#333',
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
