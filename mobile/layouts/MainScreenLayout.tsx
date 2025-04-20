import ThemedView from '@/components/theme/ThemedView';
import React, { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const MainScreenLayout = ({ children }: { children: ReactNode }) => {

    return (
        <SafeAreaView style={[styles.safeArea]}>
            <ThemedView style={styles.container}>
                {children}
            </ThemedView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        height: '100%',
        flex: 1,
    },
    container: {
        flex: 1,
        paddingHorizontal: 10,
        paddingBottom: 20,
    }
});
