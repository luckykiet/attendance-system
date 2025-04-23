import React from 'react';
import { TextInput, TextInputProps, StyleSheet, Text } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import ThemedView from './ThemedView';
import ThemedText from './ThemedText';

export type ThemedTextInputProps = TextInputProps & {
    lightColor?: string;
    darkColor?: string;
    label?: string;
    labelStyle?: object;
    containerStyle?: object;
    error?: string;
};

const ThemedTextInput: React.FC<ThemedTextInputProps> = ({
    style,
    lightColor,
    darkColor,
    placeholderTextColor,
    label,
    labelStyle,
    containerStyle,
    error,
    multiline,
    numberOfLines = 4,
    ...rest
}) => {
    const backgroundColor = useThemeColor({ light: lightColor || '#fff', dark: darkColor || '#333' }, 'background');
    const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
    const placeholderColor = placeholderTextColor || useThemeColor({ light: '#888', dark: '#aaa' }, 'textSecondary');

    const errorColor = useThemeColor({ light: '#e63946', dark: '#ff6b6b' }, 'text');

    return (
        <ThemedView style={[styles.inputContainer, containerStyle]}>
            {label && <ThemedText style={[styles.label, labelStyle]}>{label}</ThemedText>}
            <TextInput
                style={[
                    multiline && styles.multilineInput,
                    styles.input,
                    { backgroundColor, color: textColor },
                    error && styles.inputError,
                    style,
                ]}
                placeholderTextColor={placeholderColor}
                multiline={multiline}
                numberOfLines={multiline ? numberOfLines : undefined}
                {...rest}
            />
            {!!error && <Text style={[styles.errorText, { color: errorColor }]}>{error}</Text>}
        </ThemedView>
    );
};

const styles = StyleSheet.create({
    label: {
        marginBottom: 6,
        fontSize: 15,
        fontWeight: '500',
    },
    inputContainer: {
        width: '100%',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
        fontSize: 16,
        lineHeight: 24,
        width: '100%',
    },
    inputError: {
        borderColor: '#e63946',
    },
    multilineInput: {
        height: 120,
        paddingTop: 12,
        paddingBottom: 12,
    },
    errorText: {
        fontSize: 13,
        marginTop: 4,
    },
});

export default ThemedTextInput;
