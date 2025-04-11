import AsyncStorage from '@react-native-async-storage/async-storage';
import baseURL from '../assets/common/baseurl';
import Toast from 'react-native-toast-message';

export const syncCartWithServer = async (token) => {
    try {
      console.log('Starting cart sync...');
      const localCart = await AsyncStorage.getItem('localCart');
      if (!localCart) {
        console.log('No local cart found');
        return;
      }
  
      const cartItems = JSON.parse(localCart);
      
      if (cartItems.length === 0) {
        console.log('Local cart is empty');
        return;
      }
  
      console.log(`Syncing ${cartItems.length} items...`);
      
      for (const item of cartItems) {
        try {
          console.log(`Syncing item: ${item.productId}`);
          const response = await fetch(`${baseURL}/cart/add`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              productId: item.productId,
              color: item.color,
              quantity: item.quantity,
              price: item.price
            })
          });
  
          if (!response.ok) {
            const errorData = await response.json();
            console.error(`Failed to sync item ${item.productId}:`, errorData);
            throw new Error(`Failed to sync item ${item.productId}: ${errorData.message || 'Unknown error'}`);
          }
          
          console.log(`Successfully synced item ${item.productId}`);
        } catch (itemError) {
          console.error(`Error syncing item ${item.productId}:`, itemError);
        }
      }
  
      console.log('Cart sync complete, removing local cart');
      await AsyncStorage.removeItem('localCart');
      
    } catch (error) {
      console.error('Cart sync error:', error);
      Toast.show({
        type: 'error',
        text1: 'Cart Sync Issue',
        text2: 'Some items may not have synced - they remain in your local cart',
        position: 'bottom'
      });
    }
};