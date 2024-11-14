// ThemeSwitcher.tsx

import { View, Text, Switch, StyleSheet, Appearance, Platform } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';

export const ThemeSwitcher: React.FC = () => {
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';

    const toggleTheme = () => {
        if (Platform.OS !== 'web') {
            Appearance.setColorScheme(colorScheme === 'light' ? 'dark' : 'light');
        }
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
