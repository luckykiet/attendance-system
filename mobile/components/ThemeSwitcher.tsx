import React, { useEffect } from 'react';
import { View, Text, Switch, StyleSheet, Appearance, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAppStore } from '@/stores/useAppStore';

export const ThemeSwitcher: React.FC = () => {
    const { theme, setTheme } = useAppStore();
    const colorScheme = useColorScheme();
    const isDarkMode = theme === 'dark';
    
    useEffect(() => {
        const loadTheme = async () => {
            const savedTheme = await AsyncStorage.getItem('theme');
            if (savedTheme) {
                Appearance.setColorScheme(savedTheme === 'dark' ? 'dark' : 'light');
                setTheme(savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : 'light');
            } else {
                setTheme(colorScheme === 'dark' || colorScheme === 'light' ? colorScheme : 'light');
            }
        };

        loadTheme();
    }, []);

    const toggleTheme = async () => {
        const newTheme = isDarkMode ? 'light' : 'dark';
        setTheme(newTheme);

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
