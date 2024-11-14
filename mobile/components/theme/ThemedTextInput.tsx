import { TextInput, type TextInputProps, StyleSheet } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedTextInputProps = TextInputProps & {
    lightColor?: string;
    darkColor?: string;
};

const ThemedTextInput: React.FC<ThemedTextInputProps> = ({
    style,
    lightColor,
    darkColor,
    ...rest
}) => {
    const backgroundColor = useThemeColor({ light: lightColor || '#fff', dark: darkColor || '#333' }, 'background');
    const color = useThemeColor({ light: '#000', dark: '#fff' }, 'text');

    return (
        <TextInput
            style={[styles.input, { backgroundColor, color }, style]}
            placeholderTextColor={color}
            {...rest}
        />
    );
};

const styles = StyleSheet.create({
    input: {
        padding: 10,
        borderRadius: 5,
        borderWidth: 1,
        fontSize: 16,
        lineHeight: 24,
    },
});

export default ThemedTextInput;
