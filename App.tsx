/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { RootNavigator } from './src/navigation/RootNavigator';
import { BrandLogo } from './src/components/BrandLogo';
import { UpdateModal } from './src/components/UpdateModal';
import { colors, spacing } from './src/theme';
import { persistor, store } from './src/store';
import { getSavedServerUrl } from './src/store/serverStorage';
import { checkForAppUpdates, UpdateInfo } from './src/services/updateService';

function App(): React.JSX.Element {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isMandatory, setIsMandatory] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    getSavedServerUrl().catch(() => undefined);

    // Check for updates automatically on app startup
    checkForAppUpdates().then(result => {
      if (result.hasUpdate && result.updateInfo) {
        setUpdateInfo(result.updateInfo);
        setIsMandatory(result.isMandatory);
        setShowUpdateModal(true);
      }
    });
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingFallback />} persistor={persistor}>
        <SafeAreaProvider>
          <StatusBar barStyle="dark-content" />
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
          <UpdateModal
            visible={showUpdateModal}
            updateInfo={updateInfo}
            isMandatory={isMandatory}
            onDismiss={() => setShowUpdateModal(false)}
          />
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}

function LoadingFallback(): React.JSX.Element {
  return (
    <View style={styles.loadingContainer}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.loadingContent}>
        <BrandLogo size="lg" showTagline />
        <View style={styles.loadingIndicatorContainer}>
          <ActivityIndicator size="small" color={colors.gold} />
          <Text style={styles.loadingText}>PREPARING D&G STORE</Text>
        </View>
      </View>
      <View style={styles.loadingFooter}>
        <Text style={styles.footerText}>RWANDA'S PREMIER BOUTIQUE</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: colors.paper,
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.page,
    paddingVertical: spacing.xl * 2,
  },
  loadingContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  loadingIndicatorContainer: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  loadingText: {
    color: colors.goldDark,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: spacing.xs,
  },
  loadingFooter: {
    alignItems: 'center',
  },
  footerText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
});

export default App;

