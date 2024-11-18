import { StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import { useAppStore } from '@/stores/useAppStore';

import { MainScreenLayout } from '@/layouts/MainScreenLayout';
import ThemedText from '@/components/theme/ThemedText';
import ThemedView from '@/components/theme/ThemedView';
import useTranslation from '@/hooks/useTranslation';
import { LocationRequest } from '@/components/LocationRequest';
import MyCompanies from '@/components/MyCompanies';

const CompanyScreen: React.FC = () => {
  const { t } = useTranslation();
  const { urls } = useAppStore();
  const appName = Constants.expoConfig?.name || 'ATTENDANCE SYSTEM';

  return (
    <MainScreenLayout>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>{t(appName)}</ThemedText>
        {urls.length > 0 && <MyCompanies />}
        <LocationRequest />
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
    flex: 1,
    gap: 20,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
});

export default CompanyScreen;
