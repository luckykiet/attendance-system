
import { StyleSheet } from 'react-native';
import Constants from 'expo-constants';

import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import URLSelection from '@/components/UrlSelection';
import { MainScreenLayout } from '@/layouts/MainScreenLayout';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import ThemedText from '@/components/theme/ThemedText';
import ThemedView from '@/components/theme/ThemedView';
import useTranslation from '@/hooks/useTranslation';
import { AppId } from '@/components/AppId';
import { BiometricSwitcher } from '@/components/BiometricSwitcher';
import _ from 'lodash';

const SettingsScreen: React.FC = () => {
  const { t } = useTranslation();
  const manifest = Constants.expoConfig;
  return (
    <MainScreenLayout>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>{t('misc_settings')}</ThemedText>
        <URLSelection />
        <AppId />
        <LanguageSwitcher />
        <BiometricSwitcher />
        <ThemeSwitcher />
        {manifest && <ThemedText style={{ textAlign: 'center', marginTop: 20 }}>
          {`v${manifest.version}`} {manifest.extra && !_.isEmpty(manifest.extra.update) ? `(u${manifest.extra.update})` : ''}
        </ThemedText>}
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