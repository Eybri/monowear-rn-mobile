import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  Image,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import baseURL from '../assets/common/baseurl';
import * as ImagePicker from 'expo-image-picker';
import Icon from 'react-native-vector-icons/FontAwesome';
import mime from 'mime';
import Toast from 'react-native-toast-message';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const navigation = useNavigation();

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Need access to your photos');
        return;
      }

      setAvatarUploading(true);
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setAvatar(result.assets[0].uri);
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to select image',
        position: 'bottom'
      });
    } finally {
      setAvatarUploading(false);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Need access to your camera');
        return;
      }

      setAvatarUploading(true);
      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setAvatar(result.assets[0].uri);
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to take photo',
        position: 'bottom'
      });
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill in all fields',
        position: 'bottom'
      });
      return;
    }
  
    if (password !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Passwords do not match',
        position: 'bottom'
      });
      return;
    }

    if (password.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Password must be at least 6 characters',
        position: 'bottom'
      });
      return;
    }

    setLoading(true);
    
    try {
      let formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('password', password);
      
      if (avatar) {
        const newImageUri = avatar.startsWith('file://') ? avatar : `file://${avatar}`;
        formData.append('avatar', {
          uri: newImageUri,
          type: mime.getType(newImageUri),
          name: newImageUri.split('/').pop()
        });
      }

      const response = await axios.post(`${baseURL}/register`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        },
        timeout: 15000
      });

      Toast.show({
        type: "success",
        text1: "Registration Successful",
        text2: "You can now login to your account",
        position: 'bottom'
      });

      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setAvatar(null);
      
      setTimeout(() => navigation.navigate('Login'), 1000);
      
    } catch (error) {
      let errorMessage = "Registration failed. Please try again.";
      if (error.response) {
        errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      `Server error (${error.response.status})`;
      } else if (error.request) {
        errorMessage = "No response from server. Check your connection.";
      } else {
        errorMessage = error.message || "Registration failed";
      }

      Toast.show({
        type: 'error',
        text1: 'Registration Failed',
        text2: errorMessage,
        position: 'bottom'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidView}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.mainContainer}>
          <View style={styles.formContainer}>
            <Text style={styles.title}>Create Account</Text>
            
            <View style={styles.imageContainer}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.profileImage} />
              ) : (
                <View style={styles.profilePlaceholder}>
                  <Icon name="user" size={50} color="#a0d6b4" />
                </View>
              )}
              
              {avatarUploading ? (
                <ActivityIndicator size="small" color="#5e8c7f" style={styles.uploadIndicator} />
              ) : (
                <View style={styles.imageButtons}>
                  <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                    <Icon name="image" size={18} color="#f0f7f4" />
                    <Text style={styles.imageButtonText}>Gallery</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
                    <Icon name="camera" size={18} color="#f0f7f4" />
                    <Text style={styles.imageButtonText}>Camera</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#a0d6b4"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#a0d6b4"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Password (min 6 characters)"
              placeholderTextColor="#a0d6b4"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#a0d6b4"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
            
            <TouchableOpacity 
              style={[styles.button, loading && styles.disabledButton]} 
              onPress={handleRegister} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#f0f7f4" />
              ) : (
                <Text style={styles.buttonText}>Register</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.loginLink} 
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.linkText}>Already have an account? <Text style={styles.linkTextBold}>Login</Text></Text>
            </TouchableOpacity>
          </View>
        </View>
        <Toast />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidView: {
    flex: 1,
    backgroundColor: '#1a2e35',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: 25,
    paddingVertical: 20,
  },
  formContainer: {
    backgroundColor: '#2c4a52',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 25,
    textAlign: 'center',
    color: '#f0f7f4',
    letterSpacing: 0.5,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#5e8c7f',
  },
  profilePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#3a5a5f',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#5e8c7f',
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  imageButton: {
    backgroundColor: '#5e8c7f',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    minWidth: 100,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  imageButtonText: {
    color: '#f0f7f4',
    fontSize: 14,
    fontWeight: '500',
  },
  uploadIndicator: {
    marginTop: 10,
  },
  input: {
    height: 50,
    borderColor: '#3a5a5f',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 15,
    borderRadius: 10,
    fontSize: 16,
    backgroundColor: '#3a5a5f',
    color: '#f0f7f4',
  },
  button: {
    backgroundColor: '#5e8c7f',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  disabledButton: {
    backgroundColor: '#3a5a5f',
  },
  buttonText: {
    color: '#f0f7f4',
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  loginLink: {
    marginTop: 10,
    alignItems: 'center',
  },
  linkText: {
    color: '#a0d6b4',
    textAlign: 'center',
    fontSize: 15,
  },
  linkTextBold: {
    fontWeight: '600',
    color: '#f0f7f4',
  },
});

export default Register;