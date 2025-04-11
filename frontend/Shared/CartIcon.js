import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute } from '@react-navigation/native';
import baseURL from '../assets/common/baseurl';

const CartIcon = ({ navigation }) => {
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const [cartCount, setCartCount] = useState(0);
  const route = useRoute();

  const fetchCartCount = async () => {
    try {
      const token = await AsyncStorage.getItem('jwt');
      
      if (isAuthenticated && token) {
        try {
          const response = await fetch(`${baseURL}/cart/count`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!response.ok) throw new Error('Request failed');
          
          const data = await response.json();
          setCartCount(data.cartItemCount || 0);
          return;
        } catch (networkError) {
          console.log('Falling back to local cart due to network error');
        }
      }
      
      // For local cart, count unique product+color combinations
      const localCart = await AsyncStorage.getItem('localCart');
      const cartItems = localCart ? JSON.parse(localCart) : [];
      
      // Count each unique product+color combination as 1 item
      setCartCount(cartItems.length);
    } catch (error) {
      console.error('Error fetching cart count:', error);
      setCartCount(0);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchCartCount);
    fetchCartCount(); // Initial fetch

    return unsubscribe;
  }, [isAuthenticated, user, navigation]);

  // Add this effect to listen for route params changes
  useEffect(() => {
    if (route.params?.refreshCart) {
      fetchCartCount();
    }
  }, [route.params?.refreshCart]);

  const handlePress = () => {
    navigation.navigate('Cart');
  };

  return (
    <TouchableOpacity style={styles.cartButton} onPress={handlePress}>
      <Ionicons name="cart" size={22} color="black" />
      {cartCount > 0 && (
        <View style={styles.cartBadge}>
          <Text style={styles.cartBadgeText}>
            {cartCount > 9 ? '9+' : cartCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cartButton: {
    position: 'relative',
    marginLeft: 16,
  },
  cartBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'black',
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default CartIcon;