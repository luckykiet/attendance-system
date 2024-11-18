import { StyleSheet } from 'react-native';
import { useAppStore } from '@/stores/useAppStore';

import { MainScreenLayout } from '@/layouts/MainScreenLayout';
import ThemedView from '@/components/theme/ThemedView';
import MyCompanies from '@/components/MyCompanies';

const CompanyScreen: React.FC = () => {
  const { urls } = useAppStore();

  return (
    <MainScreenLayout>
      <ThemedView style={styles.container}>
        {urls.length > 0 && <MyCompanies />}
      </ThemedView>
    </MainScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 20,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
});

export default CompanyScreen;
