import { Platform } from 'react-native';

let baseURL = 'http://192.168.100.5:5000/api/v1';

// For Android emulator, localhost refers to the emulator itself
if (Platform.OS === 'android') {
    // 10.0.2.2 is the special IP for reaching the host from Android emulator
    baseURL = 'http://192.168.100.5:5000/api/v1';
} 
// For iOS simulator, localhost refers to the Mac host
else if (Platform.OS === 'ios') {
    baseURL = 'http://localhost:5000/api/v1';
}
// For physical devices or when using specific IP
else {
    baseURL = 'http://192.168.100.5:5000/api/v1';
}

export default baseURL;