/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    buttonBackground: '#6200EE',
    buttonText: '#FFFFFF',
    spinner: '#333',
    border: '#11181C',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    buttonBackground: '#BB86FC',
    buttonText: '#000000',
    spinner: '#FFF',
    border: '#ECEDEE',
  },
  success: '#5cb85c',
  info: '#5bc0de',
  error: '#d9534f',
  warning: '#f0ad4e',
  primary: '#0275d8',
  secondary: '#6c757d',
};
