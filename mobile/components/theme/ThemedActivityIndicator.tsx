import React from 'react';
import { ActivityIndicator, ActivityIndicatorProps } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedActivityIndicatorProps = ActivityIndicatorProps & {
    lightColor?: string;
    darkColor?: string;
};

const ThemedActivityIndicator: React.FC<ThemedActivityIndicatorProps> = ({
    lightColor,
    darkColor,
    size = 'small',
    ...rest
}) => {
    const color = useThemeColor({ light: lightColor, dark: darkColor }, 'spinner');

    return <ActivityIndicator size={size} color={color} {...rest} />;
};

export default ThemedActivityIndicator;
