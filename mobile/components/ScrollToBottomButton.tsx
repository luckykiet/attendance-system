import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';

interface Props {
  onPress: () => void;
}

const ScrollToBottomButton: React.FC<Props> = ({ onPress }) => {
  const colorScheme = useColorScheme();

  return (
    <TouchableOpacity
      style={[
        styles.arrowContainer,
        { backgroundColor: colorScheme === 'dark' ? '#979998' : '#e3e6e4' }
      ]}
      onPress={onPress}
    >
      <MaterialIcons
        name="keyboard-arrow-down"
        size={24}
        color={colorScheme === 'light' ? 'black' : 'white'}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  arrowContainer: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    borderRadius: 15,
    padding: 5,
    zIndex: 999,
  },
});

export default ScrollToBottomButton;
