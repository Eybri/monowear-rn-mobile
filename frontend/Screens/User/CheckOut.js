import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  RefreshControl
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Loading from '../../Shared/Loading'; 
import baseURL from '../../assets/common/baseurl';
import AddressCard from './AddressCard';

const CheckOut = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const [cartItems, setCartItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);
  const SHIPPING_FEE = 40; // Fixed shipping fee

  const fetchCartItems = async () => {
    try {
      const response = await fetch(`${baseURL}/cart/items`, {
        headers: {
          'Authorization': `Bearer ${await AsyncStorage.getItem('jwt')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch cart items');
      
      const data = await response.json();
      const items = data.items || [];
      
      // Process items to merge only if same product, color AND size
      const processedItems = items.reduce((acc, item) => {
        const existingItem = acc.find(i => 
          i.product?._id === item.product?._id && 
          i.color === item.color && 
          i.size === item.size
        );
        
        if (existingItem) {
          existingItem.quantity += item.quantity;
        } else {
          acc.push({...item});
        }
        return acc;
      }, []);
      
      setCartItems(processedItems);
      
      // Calculate subtotal
      const calculatedSubtotal = processedItems.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);
      
      setSubtotal(calculatedSubtotal);
      setTotal(calculatedSubtotal + SHIPPING_FEE); // Add shipping fee to subtotal
    } catch (error) {
      console.error('Error fetching cart items:', error);
      Alert.alert('Error', 'Failed to load cart items');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAddressUpdate = () => {
    fetchCartItems();
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchCartItems();
    });
    
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCartItems();
  };

  const handlePayNow = () => {
    // Check if shipping address is complete
    if (!user?.shippingInfo?.address || 
        !user?.shippingInfo?.city || 
        !user?.shippingInfo?.phoneNo || 
        !user?.shippingInfo?.postalCode || 
        !user?.shippingInfo?.country) {
      Alert.alert(
        'Shipping Address Required',
        'Please complete your shipping address before proceeding to payment',
        [
          {
            text: 'OK',
            style: 'default'
          }
        ]
      );
      return;
    }

    // Check if cart is empty
    if (cartItems.length === 0) {
      Alert.alert(
        'Empty Cart',
        'Your cart is empty. Please add items before checkout.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Navigate to payment with necessary data
    navigation.navigate('Payment', { 
      total: total,
      shippingInfo: user.shippingInfo,
      cartItems: cartItems
    });
  };

  const renderCartItem = (item, index) => {
    return (
      <View key={`${item._id || item.product?._id}-${item.color}-${item.size}-${index}`} style={styles.cartItem}>
        <View style={styles.itemNumberContainer}>
          <Text style={styles.itemNumber}>{item.quantity}</Text>
        </View>
        <Image 
          source={{ uri: item.image || item.product?.images[0]?.url }} 
          style={styles.itemImage}
        />
        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>{item.name || item.product?.name}</Text>
          <Text style={styles.itemSpecs}>{item.size} / {item.color}</Text>
        </View>
        <Text style={styles.itemPrice}>₱{(item.price * item.quantity).toFixed(2)}</Text>
      </View>
    );
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#2d6a4f"
        />
      }
    >
      {/* Shipping Address Card */}
      <AddressCard user={user} onUpdate={handleAddressUpdate} />

      {/* Order Summary */}
      <View style={styles.summaryBox}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          <Text style={styles.itemsCount}>{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</Text>
        </View>
        
        <View style={styles.itemsContainer}>
          {cartItems.map((item, index) => renderCartItem(item, index))}
        </View>
        
        {/* Price Summary */}
        <View style={styles.priceSummary}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>₱{subtotal.toFixed(2)}</Text>
          </View>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Shipping Fee</Text>
            <Text style={styles.priceValue}>₱{SHIPPING_FEE.toFixed(2)}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₱{total.toFixed(2)}</Text>
          </View>
        </View>
        
        {/* Payment Button */}
        <TouchableOpacity 
          style={styles.payNowButton}
          onPress={handlePayNow}
        >
          <Text style={styles.payNowButtonText}>Check Out</Text>
        </TouchableOpacity>
        
        {/* Policies Section */}
        <View style={styles.policyContainer}>
          <TouchableOpacity style={styles.policyLink}>
            <Ionicons name="document-text-outline" size={14} color="#2d6a4f" />
            <Text style={styles.policyLinkText}>Shipping Policy</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.policyLink}>
            <Ionicons name="shield-checkmark-outline" size={14} color="#2d6a4f" />
            <Text style={styles.policyLinkText}>Terms of Service</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.footer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    paddingVertical: 12,
  },
  summaryBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 8,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  itemsCount: {
    fontSize: 13,
    color: '#666',
  },
  itemsContainer: {
    marginBottom: 16,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemNumberContainer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  itemNumber: {
    color: '#2d6a4f',
    fontSize: 11,
    fontWeight: '600',
  },
  itemImage: {
    width: 54,
    height: 54,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: '#f5f5f5',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 3,
    color: '#333',
  },
  itemSpecs: {
    fontSize: 12,
    color: '#777',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  priceSummary: {
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalRow: {
    marginTop: 4,
    marginBottom: 0,
  },
  priceLabel: {
    fontSize: 13,
    color: '#666',
  },
  priceValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
  payNowButton: {
    backgroundColor: '#2d6a4f',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  payNowButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  policyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  policyLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  policyLinkText: {
    fontSize: 12,
    color: '#2d6a4f',
    marginLeft: 4,
  },
  footer: {
    height: 20,
  }
});

export default CheckOut;