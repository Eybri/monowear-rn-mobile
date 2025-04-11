// App.js
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import store from './Redux/store';
import Toast from 'react-native-toast-message';
import MainNavigator from './Navigators/MainNavigator';
import { navigationRef } from './Navigators/NavigationService';

export default function App() {
  return (
    <Provider store={store}>
      <NavigationContainer ref={navigationRef}>
        <View style={styles.container}>
          <StatusBar style="auto" />
          <MainNavigator />
        </View>
        <Toast />
      </NavigationContainer>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});