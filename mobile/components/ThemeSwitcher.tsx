import React, { useEffect, useState } from 'react';
import { View, Text, Switch, StyleSheet, Appearance, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from '@/hooks/useColorScheme';

export const ThemeSwitcher: React.FC = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const colorScheme = useColorScheme();
    useEffect(() => {
        const loadTheme = async () => {
            const savedTheme = await AsyncStorage.getItem('theme');
            if (savedTheme) {
                Appearance.setColorScheme(savedTheme === 'dark' ? 'dark' : 'light');
                setIsDarkMode(savedTheme === 'dark');
            } else {
                setIsDarkMode(colorScheme === 'dark');
            }
        };

        loadTheme();
    }, []);

    const toggleTheme = async () => {
        const newTheme = isDarkMode ? 'light' : 'dark';
        setIsDarkMode(!isDarkMode);

        if (Platform.OS !== 'web') {
            Appearance.setColorScheme(newTheme);
        }

        await AsyncStorage.setItem('theme', newTheme);
    };

    return (
        <View style={[styles.container]}>
            <Text style={[styles.label, { color: isDarkMode ? '#fff' : '#000' }]}>Dark Mode</Text>
            <Switch value={isDarkMode} onValueChange={toggleTheme} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    label: {
        fontSize: 16,
        marginRight: 10,
    },
});
