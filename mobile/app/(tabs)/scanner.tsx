import { StyleSheet } from 'react-native';

import { MainScreenLayout } from '@/layouts/MainScreenLayout';
import ThemedView from '@/components/theme/ThemedView';
import CameraScanner from '@/components/CameraScanner';

const ScannerScreen: React.FC = () => {

    return (
        <MainScreenLayout>
            <ThemedView style={styles.container}>
                <CameraScanner />
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
        height: '100%',
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
