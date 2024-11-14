import { StyleSheet, TouchableOpacity } from 'react-native';
import Constants from 'expo-constants';
import { useAppStore } from '@/stores/useAppStore';

import { MainScreenLayout } from '@/layouts/MainScreenLayout';
import ThemedText from '@/components/theme/ThemedText';
import ThemedView from '@/components/theme/ThemedView';
import useTranslation from '@/hooks/useTranslation';
import { Link } from 'expo-router';
import { LocationRequest } from '@/components/LocationRequest';
import NearbyCompanies from '@/components/NearbyCompanies';

const HomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const { urls } = useAppStore();
  const appName = Constants.expoConfig?.name || 'ATTENDANCE SYSTEM';

  return (
    <MainScreenLayout>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>{t(appName)}</ThemedText>
        {urls.length === 0 && (
          <Link href="/(tabs)/settings" asChild>
            <TouchableOpacity style={styles.setupButton}>
              <ThemedText type="link" style={styles.setupButtonText}>{t('misc_setup_urls')}</ThemedText>
            </TouchableOpacity>
          </Link>
        )}
        <NearbyCompanies />
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
  setupButton: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#457b9d',
    borderRadius: 5,
    marginBottom: 15,
  },
  setupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default HomeScreen;
