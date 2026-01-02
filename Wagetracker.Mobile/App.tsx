import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { StyleSheet, View, Text } from 'react-native';
import Toast, { BaseToast, ToastConfig } from 'react-native-toast-message';
import { colors } from './src/theme';

const toastConfig: ToastConfig = {
  delete: ({ text1, text2 }) => (
    <View style={toastStyles.deleteContainer}>
      <Text style={toastStyles.deleteTitle}>{text1}</Text>
      {text2 && <Text style={toastStyles.deleteMessage}>{text2}</Text>}
    </View>
  ),
};

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <AppNavigator />
        <Toast config={toastConfig} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

const toastStyles = StyleSheet.create({
  deleteContainer: {
    width: '90%',
    backgroundColor: colors.danger,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  deleteTitle: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  deleteMessage: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    marginTop: 2,
  },
});
