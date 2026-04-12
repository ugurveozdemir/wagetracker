import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import Toast, { ToastConfig, ToastConfigParams } from 'react-native-toast-message';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from './src/theme';

type ToastVariant = 'success' | 'info' | 'error' | 'delete';

const toastThemes: Record<ToastVariant, { backgroundColor: string; icon: string; iconColor: string }> = {
  success: {
    backgroundColor: colors.primaryLight,
    icon: 'check',
    iconColor: colors.primaryLight,
  },
  info: {
    backgroundColor: '#bd4700',
    icon: 'info-outline',
    iconColor: '#bd4700',
  },
  error: {
    backgroundColor: '#b3261e',
    icon: 'priority-high',
    iconColor: '#b3261e',
  },
  delete: {
    backgroundColor: '#7f1212',
    icon: 'delete-outline',
    iconColor: '#7f1212',
  },
};

const CustomToast = ({ text1, text2, type }: ToastConfigParams<any> & { type: ToastVariant }) => {
  const theme = toastThemes[type];

  return (
    <View style={[toastStyles.toastCard, { backgroundColor: theme.backgroundColor }]}> 
      <View style={toastStyles.iconBubble}>
        <MaterialIcons name={theme.icon} size={22} color={theme.iconColor} />
      </View>

      <View style={toastStyles.content}>
        <Text style={toastStyles.title}>{text1}</Text>
        {text2 ? <Text style={toastStyles.message}>{text2}</Text> : null}
      </View>

      <TouchableOpacity
        style={toastStyles.closeButton}
        activeOpacity={0.75}
        onPress={() => Toast.hide()}
      >
        <MaterialIcons name="close" size={22} color="rgba(255,255,255,0.88)" />
      </TouchableOpacity>
    </View>
  );
};

const toastConfig: ToastConfig = {
  success: (props) => <CustomToast {...props} type="success" />,
  info: (props) => <CustomToast {...props} type="info" />,
  error: (props) => <CustomToast {...props} type="error" />,
  delete: (props) => <CustomToast {...props} type="delete" />,
};

function AppContent() {
  const { top } = useSafeAreaInsets();

  return (
    <>
      <AppNavigator />
      <Toast config={toastConfig} topOffset={top + 12} />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <AppContent />
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
  toastCard: {
    width: '90%',
    minHeight: 80,
    borderRadius: 28,
    paddingLeft: 18,
    paddingRight: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: 'rgba(24,29,25,0.45)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 10,
  },
  iconBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  content: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  message: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
