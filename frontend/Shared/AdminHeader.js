// components/AdminHeader.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../Redux/Actions/Auth.actions';
import { useNavigation } from '@react-navigation/native';

const AdminHeader = ({ title }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const handleLogout = async () => {
    const success = await dispatch(logoutUser());
    if (success) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'App' }],
      });
    }
    setShowDropdown(false);
  };

  const switchToUserMode = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'App' }],
    });
    setShowDropdown(false);
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/Logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>
      
      <Text style={styles.headerTitle}>{title}</Text>
      
      <View style={styles.headerRight}>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setShowDropdown(!showDropdown)}
        >
          <Ionicons name="ellipsis-vertical" size={24} color="black" />
        </TouchableOpacity>
        
        {showDropdown && (
          <View style={styles.dropdownMenu}>
            <TouchableOpacity 
              style={styles.dropdownItem}
              onPress={switchToUserMode}
            >
              <Ionicons name="person-outline" size={18} color="black" />
              <Text style={styles.dropdownText}>User Mode</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.dropdownItem}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={18} color="black" />
              <Text style={styles.dropdownText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  logoContainer: {
    flex: 1,
  },
  logoImage: {
    width: 120,
    height: 30,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
    position: 'relative',
  },
  menuButton: {
    padding: 5,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 100,
    minWidth: 150,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dropdownText: {
    marginLeft: 10,
    fontSize: 14,
  },
});

export default AdminHeader;