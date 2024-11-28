import { Ionicons } from '@expo/vector-icons';
import { useRegistrationApi } from '@/api/useRegistrationApi';
import useTranslation from '@/hooks/useTranslation';
import { useAppStore } from '@/stores/useAppStore';
import { RegistrationIntentData } from '@/types/intents';
import { delay, isValidUrl, parseAttendanceUrl } from '@/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from 'expo-router';
import _ from 'lodash';
import ThemedText from './theme/ThemedText';

export default function CameraScanner() {
    const { t } = useTranslation();
    const [facing, setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const { getRegistration } = useRegistrationApi();
    const { setRegistration } = useAppStore();
    const [intentData, setIntentData] = useState<RegistrationIntentData | null>(null);
    const [lastScannedItem, setLastScannedItem] = useState<string | null>(null);
    const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
    const navigation = useNavigation();
    const queryClient = useQueryClient();

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

    const registrationFormQuery = useQuery<unknown, Error | string>({
        queryKey: ['registrationForm', intentData],
        queryFn: () => getRegistration(intentData?.domain || '', intentData?.tokenId || ''),
        enabled: !!intentData?.domain && !!intentData?.tokenId && !_.isEmpty(intentData),
        refetchOnWindowFocus: false,
        retry: false,
        staleTime: Infinity,
    });

    const { data: registrationForm } = registrationFormQuery;

    const toggleCameraFacing = () => {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    }

    const handleBarCodeScanned = async ({ data }: { data: string }) => {
        if (data === lastScannedItem) return;
        setLastScannedItem(data);
        await delay(1000);

        const parsedData = parseAttendanceUrl(data);

        if (parsedData.params.domain && parsedData.params.tokenId) {
            setIntentData({
                path: parsedData.path,
                domain: parsedData.params.domain,
                tokenId: parsedData.params.tokenId,
            });
        } else if (isValidUrl(data)) {
            Linking.openURL(data);
        }
    };

    const handleClearScannedItem = () => {
        setLastScannedItem(null);
        setIntentData(null);
        queryClient.removeQueries({ queryKey: ['registrationForm'] });
    }

    useEffect(() => {
        if (!registrationFormQuery.isStale && !_.isEmpty(intentData) && !_.isEmpty(intentData.domain) && !_.isEmpty(intentData.tokenId)) {
            registrationFormQuery.refetch();
        }
    }, [intentData]);

    useEffect(() => {
        if (intentData && registrationFormQuery.error) {
            Alert.alert(t('misc_error'), t(typeof registrationFormQuery.error === 'string' ? registrationFormQuery.error : registrationFormQuery.error.message || 'misc_error'));
        }
    }, [registrationFormQuery.error, intentData]);

    useEffect(() => {
        if (registrationForm) {
            setRegistration({ ...registrationForm, tokenId: intentData?.tokenId || '', domain: intentData?.domain || '' });
            navigation.navigate("(hidden)/registration" as never);
            handleClearScannedItem();
        }
    }, [registrationForm]);

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
                <TouchableOpacity style={styles.permissionButton} onPress={openAppSettings}>
                    <ThemedText style={styles.permissionButtonText}>{t('misc_grant_permission')}</ThemedText>
                </TouchableOpacity>
            </View>
        );
    }
    return (
        <View style={styles.container}>
            {isCameraActive && <CameraView
                style={styles.camera}
                facing={facing}
                onBarcodeScanned={handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}>
                {(registrationFormQuery.isLoading || registrationFormQuery.isFetching) ? (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#fff" />
                        <Text style={styles.loadingText}>{t('misc_loading_data')}</Text>
                    </View>
                ) :
                    <View style={styles.qrOverlay}>
                        <View style={styles.qrFrame} />
                        <Text style={styles.qrMessage}>{t('misc_align_camera_to_qr_code')}</Text>
                    </View>}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
                        <Ionicons name="camera-reverse" size={30} color="white" />
                    </TouchableOpacity>
                </View>
            </CameraView>}
            {lastScannedItem && (
                <View style={styles.scannedItemContainer}>
                    <Text style={styles.scannedItemData}>{lastScannedItem}</Text>
                    <TouchableOpacity onPress={handleClearScannedItem}>
                        <Ionicons name="close-circle" size={24} color="gray" />
                    </TouchableOpacity>
                </View>
            )}
            <ThemedText style={styles.message}>{t('misc_allow_camera_permission_to_do_registration')}</ThemedText>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
    },
    message: {
        textAlign: 'center',
        paddingBottom: 10,
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
    text: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    qrOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    qrFrame: {
        width: 200,
        height: 200,
        borderWidth: 4,
        borderColor: 'white',
        borderRadius: 10,
    },
    qrMessage: {
        marginTop: 10,
        color: 'white',
        fontSize: 18,
        textAlign: 'center',
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
