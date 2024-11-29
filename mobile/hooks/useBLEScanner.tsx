import { useState, useEffect, useMemo } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import useTranslation from './useTranslation';

type ScanState = 'idle' | 'scanning' | 'success' | 'error';

interface UseBLEScannerReturn {
    scan: (uuids: string[]) => Promise<void>;
    isScanning: boolean;
    isStale: boolean;
    reset: () => void;
    rescan: () => void;
    isSuccess: boolean;
    isError: boolean;
    errors: string | null;
    foundDevices: string[];
    isPermissionGranted: boolean;
}

const useBLEScanner = (): UseBLEScannerReturn => {
    const { t } = useTranslation()
    const manager = useMemo(() => new BleManager(), []);
    const [foundDevices, setFoundDevices] = useState<string[]>([]);
    const [isScanning, setIsScanning] = useState<boolean>(false);
    const [scanState, setScanState] = useState<ScanState>('idle');
    const [errors, setErrors] = useState<string | null>(null);
    const [uuids, setUuids] = useState<string[] | null>(null);
    const [isPermissionGranted, setIsPermissionGranted] = useState<boolean>(true);

    useEffect(() => {
        return () => {
            manager.stopDeviceScan();
            manager.destroy();
        };
    }, [manager]);

    const requestPermissions = async (): Promise<boolean> => {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            ]);

            if (
                granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] !== 'granted' ||
                granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] !== 'granted' ||
                granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] !== 'granted'
            ) {
                setIsPermissionGranted(false);
                setErrors(t('srv_bluetooth_permission_not_granted'));
                return false;
            }
        }
        return true;
    };

    const scan = async (uuids: string[]): Promise<void> => {
        const permissionsGranted = await requestPermissions();
        if (!permissionsGranted) {
            setScanState('error');
            setIsPermissionGranted(false);
            return;
        }

        setUuids(uuids);
        setScanState('scanning');
        setIsScanning(true);
        setFoundDevices([]);
        setErrors(null);

        console.log('Scanning for devices...');
        manager.startDeviceScan(null, null, (error, device) => {
            if (error) {
                setErrors(error.message === 'Device is not authorized to use BluetoothLE' ? t('srv_bluetooth_permission_not_granted') : t(error.message || 'srv_scan_error'));
                setIsPermissionGranted(error.message === 'Device is not authorized to use BluetoothLE' ? false : true);
                setScanState('error');
                setIsScanning(false);
                return;
            }

            if (device && device.serviceUUIDs) {
                const matchedUUIDs = uuids.filter((uuid) => device.serviceUUIDs?.includes(uuid));
                if (matchedUUIDs.length > 0) {
                    console.log(`Found target device: ${device.id} with matched UUIDs: ${matchedUUIDs}`);
                    setFoundDevices(matchedUUIDs);
                    setScanState('success');
                }
            }
        });

        // Stop scanning after 10 seconds if no device is found
        setTimeout(() => {
            if (scanState !== 'success') {
                manager.stopDeviceScan();
                setIsScanning(false);
                setScanState(foundDevices.length > 0 ? 'success' : 'idle');
            }
        }, 10000);
    };

    const reset = () => {
        setScanState('idle');
        setFoundDevices([]);
        setErrors(null);
        setUuids(null);
    };

    const rescan = () => {
        if (uuids?.length) {
            scan(uuids);
        }
    };

    return {
        scan,
        isScanning,
        isStale: scanState === 'idle',
        reset,
        rescan,
        isSuccess: scanState === 'success',
        isError: scanState === 'error',
        errors,
        foundDevices,
        isPermissionGranted,
    };
};

export default useBLEScanner;
