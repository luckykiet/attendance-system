import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ViewStyle,
    TextStyle,
    GestureResponderEvent,
} from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

export type ThemedButtonProps = {
    title: string;
    onPress?: (event: GestureResponderEvent) => void;
    icon?: keyof typeof MaterialIcons.glyphMap;
    style?: ViewStyle;
    textStyle?: TextStyle;
    color?: 'primary' | 'success' | 'error' | 'warning' | 'info' | 'secondary' | 'default';
    lightColor?: string;
    darkColor?: string;
    disabled?: boolean;
};

const ThemedButton: React.FC<ThemedButtonProps> = ({
    title,
    onPress,
    icon,
    style,
    textStyle,
    color = 'default',
    lightColor,
    darkColor,
    disabled = false,
}) => {
    let backgroundColor: string;

    if (color === 'default') {
        backgroundColor = useThemeColor(
            { light: lightColor || Colors.light.buttonBackground, dark: darkColor || Colors.dark.buttonBackground },
            'buttonBackground'
        );
    } else {
        backgroundColor = Colors[color];
    }

    const textColor = useThemeColor({}, 'buttonText');

    return (
        <TouchableOpacity
            style={[
                styles.button,
                { backgroundColor: disabled ? '#ccc' : backgroundColor },
                style,
            ]}
            onPress={onPress}
            activeOpacity={0.8}
            disabled={disabled}
        >
            {icon && (
                <MaterialIcons name={icon} size={20} color={textColor} style={styles.icon} />
            )}
            <Text style={[styles.text, { color: textColor }, textStyle]}>{title}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
    },
    icon: {
        marginRight: 8,
    },
});

export default ThemedButton;
