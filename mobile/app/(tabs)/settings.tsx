
import { StyleSheet } from 'react-native';

import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import URLSelection from '@/components/UrlSelection';
import { MainScreenLayout } from '@/layouts/MainScreenLayout';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import ThemedText from '@/components/theme/ThemedText';
import ThemedView from '@/components/theme/ThemedView';
import useTranslation from '@/hooks/useTranslation';
import { AppId } from '@/components/AppId';

const SettingsScreen: React.FC = () => {
  const { t } = useTranslation();
  return (
    <MainScreenLayout>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>{t('misc_settings')}</ThemedText>
        <URLSelection />
        <AppId />
        <LanguageSwitcher />
        <ThemeSwitcher />
      </ThemedView>
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
  container: {
    height: '100%',
    gap: 20,
  },
});

export default SettingsScreen;