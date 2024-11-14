import ThemedView from '@/components/theme/ThemedView';
import React, { ReactNode } from 'react';
import { Platform, SafeAreaView, StyleSheet, useColorScheme } from 'react-native';

export const MainScreenLayout = ({ children }: { children: ReactNode }) => {
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';

    return (
        <SafeAreaView style={[styles.safeArea, isDarkMode ? styles.darkTheme : styles.lightTheme]}>
            <ThemedView style={styles.container}>
                {children}
            </ThemedView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        height: '100%',
        paddingTop: Platform.OS === 'android' ? 25 : 0,
    },
    container: {
        flex: 1,
        paddingHorizontal: 10,
        paddingBottom: 20,
    },
    lightTheme: {
        backgroundColor: '#f8f9fa',
    },
    darkTheme: {
        backgroundColor: '#121212',
    },
});
