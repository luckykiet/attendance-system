import { useState } from 'react';
import {
    StyleSheet,
    TouchableOpacity,
} from 'react-native';

import { MainScreenLayout } from '@/layouts/MainScreenLayout';
import ThemedView from '@/components/theme/ThemedView';
import ThemedText from '@/components/theme/ThemedText';
import CameraScanner from '@/components/CameraScanner';
import useTranslation from '@/hooks/useTranslation';
import DevicePairingModal from '@/components/DevicePairingModal';

const ScannerScreen: React.FC = () => {
    const { t } = useTranslation();
    const [modalVisible, setModalVisible] = useState(false);

    return (
        <MainScreenLayout>
            <ThemedView style={styles.container}>
                <ThemedText type="title" style={styles.title}>
                    {t('misc_device_pairing')}
                </ThemedText>

                <ThemedView style={styles.container}>
                    <CameraScanner />

                    <TouchableOpacity style={styles.setupButton} onPress={() => setModalVisible(true)}>
                        <ThemedText style={styles.setupButtonText}>
                            {t('misc_add_manually') || 'Add manually'}
                        </ThemedText>
                    </TouchableOpacity>
                </ThemedView>
                <DevicePairingModal
                    isOpen={modalVisible}
                    setIsOpen={setModalVisible}
                />
            </ThemedView>
        </MainScreenLayout>
    );
};

const styles = StyleSheet.create({
    title: {
        fontSize: 26,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 25,
        marginTop: 15,
    },
    container: {
        height: '93%',
        gap: 20,
    },
    setupButton: {
        alignSelf: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#457b9d',
        borderRadius: 5,
        marginBottom: 15,
    },
    setupButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
});

export default ScannerScreen;
