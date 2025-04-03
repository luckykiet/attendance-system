import React from 'react';
import { MainScreenLayout } from '@/layouts/MainScreenLayout';
import {
  StyleSheet,

} from 'react-native';
import InitialInstruction from '@/components/InitialInstruction';
import ThemedView from '@/components/theme/ThemedView';
import ThemedText from '@/components/theme/ThemedText';
import useTranslation from '@/hooks/useTranslation';

const InstructionPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <MainScreenLayout>
      <ThemedView>
        <ThemedText type="title" style={styles.title}>
          {t('misc_instructions')}
        </ThemedText>
      </ThemedView>
      <InitialInstruction />
    </MainScreenLayout>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 25,
    marginTop: 15,
  },
});

export default InstructionPage;
