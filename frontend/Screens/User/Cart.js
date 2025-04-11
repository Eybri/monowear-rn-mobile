import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import baseURL from '../../assets/common/baseurl';

const CartScreen = ({ navigation }) => {
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subtotal, setSubtotal] = useState(0);

  // Safe ID access helper function
  const getItemId = (item) => {
    if (isAuthenticated) {
      return item?._id?.toString() || item?.id?.toString();
    }
    return item?.localId;
  };

  useEffect(() => {
    const fetchCartItems = async () => {
      setLoading(true);
      try {
        let items = [];
        
        if (isAuthenticated && user) {
          const response = await fetch(`${baseURL}/cart/items`, {
            headers: {
              'Authorization': `Bearer ${await AsyncStorage.getItem('jwt')}`
            }
          });
          const data = await response.json();
          items = data.items || [];
          
          // Normalize server items to always have _id as string
          items = items.map(item => ({
            ...item,
            _id: item._id?.toString() || item.id?.toString()
          })).filter(item => item._id);
        } else {
          const localCart = await AsyncStorage.getItem('localCart');
          items = localCart ? JSON.parse(localCart) : [];
          
          // Ensure all local items have a stable identifier
          items = items.map(item => ({
            ...item,
            localId: item.localId || `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          }));
          
          await AsyncStorage.setItem('localCart', JSON.stringify(items));
        }

        setCartItems(items);
        calculateSubtotal(items);
      } catch (error) {
        console.error('Error fetching cart items:', error);
        Alert.alert('Error', 'Failed to load cart items');
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = navigation.addListener('focus', fetchCartItems);
    fetchCartItems();

    return unsubscribe;
  }, [isAuthenticated, user, navigation]);

  const calculateSubtotal = (items) => {
    const total = items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
    setSubtotal(total);
  };

  const updateQuantity = async (itemId, action) => {
    try {
      let updatedItems = [...cartItems];
      
      const itemIndex = updatedItems.findIndex(item => 
        getItemId(item) === itemId
      );
      
      if (itemIndex === -1) {
        throw new Error('Item not found in cart');
      }
      
      const currentItem = updatedItems[itemIndex];
      const itemStock = currentItem.stock || currentItem.product?.stock || Infinity;

      if (action === 'increase') {
        if (currentItem.quantity < itemStock) {
          updatedItems[itemIndex].quantity += 1;
        } else {
          Alert.alert('Stock Limit', `Only ${itemStock} available in stock`);
          return;
        }
      } else if (action === 'decrease') {
        if (currentItem.quantity > 1) {
          updatedItems[itemIndex].quantity -= 1;
        } else {
          updatedItems.splice(itemIndex, 1);
        }
      }

      if (isAuthenticated && user) {
        const response = await fetch(`${baseURL}/cart/update`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await AsyncStorage.getItem('jwt')}`
          },
          body: JSON.stringify({ 
            itemId: getItemId(currentItem), 
            action 
          })
        });
        navigation.setParams({ refreshCart: Date.now() });
        if (!response.ok) throw new Error('Failed to update cart on server');
      } else {
        await AsyncStorage.setItem('localCart', JSON.stringify(updatedItems));
      }

      setCartItems(updatedItems);
      calculateSubtotal(updatedItems);
    } catch (error) {
      console.error('Error updating quantity:', error);
      Alert.alert('Error', error.message || 'Failed to update quantity');
    }
  };

  const removeItem = async (itemId) => {
    try {
      const itemToRemove = cartItems.find(item => 
        getItemId(item) === itemId
      );
      
      if (!itemToRemove) {
        throw new Error('Item not found in cart');
      }

      const updatedItems = cartItems.filter(item => 
        getItemId(item) !== itemId
      );
      
      if (isAuthenticated && user) {
        const response = await fetch(`${baseURL}/cart/update`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await AsyncStorage.getItem('jwt')}`
          },
          body: JSON.stringify({ 
            itemId: getItemId(itemToRemove), 
            action: 'delete' 
          })
        });
        navigation.setParams({ refreshCart: Date.now() });

        if (!response.ok) throw new Error('Failed to remove item from server');
      } else {
        await AsyncStorage.setItem('localCart', JSON.stringify(updatedItems));
      }

      setCartItems(updatedItems);
      calculateSubtotal(updatedItems);
    } catch (error) {
      console.error('Error removing item:', error);
      Alert.alert('Error', error.message || 'Failed to remove item');
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Your cart is empty');
      return;
    }

    if (!isAuthenticated) {
      navigation.navigate('Login', { redirect: 'Checkout' });
      return;
    }

    navigation.navigate('Checkout');
  };

  const renderItem = ({ item }) => {
    const itemId = getItemId(item);
    return (
      <View style={styles.cartItem}>
        <Image 
          source={{ uri: item.image || item.product?.images[0]?.url }} 
          style={styles.itemImage}
        />
        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>{item.name || item.product?.name}</Text>
          <Text style={styles.itemColor}>Color: {item.color}</Text>
          <Text style={styles.itemPrice}>₱{(item.price * item.quantity).toFixed(2)}</Text>
          
          <View style={styles.quantityContainer}>
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => updateQuantity(itemId, 'decrease')}
            >
              <Ionicons name="remove" size={16} color="#333" />
            </TouchableOpacity>
            
            <Text style={styles.quantityText}>{item.quantity}</Text>
            
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => updateQuantity(itemId, 'increase')}
              disabled={item.quantity >= (item.stock || item.product?.stock || Infinity)}
            >
              <Ionicons 
                name="add" 
                size={16} 
                color={item.quantity >= (item.stock || item.product?.stock || Infinity) ? '#ccc' : '#333'} 
              />
            </TouchableOpacity>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => removeItem(itemId)}
        >
          <Ionicons name="trash-outline" size={20} color="#F44336" />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {cartItems.length === 0 ? (
        <View style={styles.emptyCart}>
          <Ionicons name="cart-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <TouchableOpacity 
            style={styles.continueShoppingButton}
            onPress={() => navigation.navigate('Products')}
          >
            <Text style={styles.continueShoppingText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            renderItem={renderItem}
            keyExtractor={item => getItemId(item)}
            contentContainerStyle={styles.listContent}
          />
          
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₱{subtotal.toFixed(2)}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.checkoutButton}
              onPress={handleCheckout}
            >
              <Text style={styles.checkoutButtonText}>PROCEED TO CHECKOUT</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginVertical: 16,
  },
  continueShoppingButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#000',
    borderRadius: 4,
  },
  continueShoppingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
  },
  cartItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 4,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemColor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  quantityButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  quantityText: {
    width: 40,
    textAlign: 'center',
    fontSize: 16,
  },
  removeButton: {
    padding: 8,
    marginLeft: 8,
  },
  summaryContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkoutButton: {
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 4,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CartScreen;