import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { createOrder } from '../../Redux/Actions/Order.actions';
import baseURL from "../../assets/common/baseurl";
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Payment = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { total, shippingInfo } = route.params;
  
  const [cartItems, setCartItems] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('cashondelivery');
  const [cardModalVisible, setCardModalVisible] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });
  const [loading, setLoading] = useState(false);

  // Colors
  const COLORS = {
    primary: '#2d6a4f',
    primaryLight: '#e8f5e9',
    accent: '#81c784',
    background: '#f5f7f9',
    cardBackground: '#ffffff',
    text: {
      dark: '#333333',
      medium: '#555555',
      light: '#777777'
    },
    border: '#e0e0e0',
    error: '#ff5252',
    disabled: '#bdbdbd'
  };

  // Fetch cart items when component mounts
  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('jwt');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${baseURL}/cart/items`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.data || !response.data.items) {
        throw new Error('Invalid cart items response');
      }

      // Process items to merge duplicates
      const processedItems = response.data.items.reduce((acc, item) => {
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
      
    } catch (error) {
      console.error("Error fetching cart items:", error);
      Alert.alert(
        'Error', 
        error.response?.data?.message || error.message || 'Failed to load cart items'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreditCardPayment = () => {
    // No validation required now - proceed with any input
    setCardModalVisible(false);
    processOrder();
  };

  const processOrder = async () => {
    if (!cartItems || cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty. Please add items to your cart.');
      return;
    }

    try {
      setLoading(true);
      
      // Format order data according to your Order model
      const orderData = {
        userId: user._id,
        totalPrice: total,
        paymentMethod: paymentMethod,
        paymentDetails: paymentMethod === 'creditcard' ? {
          cardNumber: cardDetails.cardNumber,
          expiryDate: cardDetails.expiryDate,
          cvv: cardDetails.cvv,
          cardholderName: cardDetails.cardholderName
        } : null,
        shippingAddress: shippingInfo
      };
      
      // Dispatch create order action
      const result = await dispatch(createOrder(orderData));
      
      if (result && result._id) {
        // Navigate to order success
        navigation.navigate('OrderSuccess', { orderId: result._id });
      } else {
        Alert.alert('Order Error', 'Failed to create order. Please try again.');
      }
      
    } catch (error) {
      console.error("Order processing error:", error);
      Alert.alert(
        'Payment Failed', 
        error.message || 'Failed to process your order. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (text) => {
    // Remove any non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    // Format with spaces after every 4 digits
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    return formatted;
  };

  const formatExpiryDate = (text) => {
    // Remove any non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    
    // Add slash after first 2 digits
    if (cleaned.length > 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  const renderCardModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={cardModalVisible}
        onRequestClose={() => setCardModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Credit Card Details</Text>
              <TouchableOpacity onPress={() => setCardModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={22} color={COLORS.text.medium} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <Text style={styles.inputLabel}>Cardholder Name</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                value={cardDetails.cardholderName}
                onChangeText={(text) => setCardDetails({...cardDetails, cardholderName: text})}
              />
              
              <Text style={styles.inputLabel}>Card Number</Text>
              <View style={styles.cardInputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="1234 5678 9012 3456"
                  keyboardType="number-pad"
                  maxLength={19} // 16 digits + 3 spaces
                  value={cardDetails.cardNumber}
                  onChangeText={(text) => setCardDetails({...cardDetails, cardNumber: formatCardNumber(text)})}
                />
                <Ionicons name="card-outline" size={22} color={COLORS.text.light} style={styles.inputIcon} />
              </View>
              
              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Expiry Date</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="MM/YY"
                    maxLength={5}
                    keyboardType="number-pad"
                    value={cardDetails.expiryDate}
                    onChangeText={(text) => setCardDetails({...cardDetails, expiryDate: formatExpiryDate(text)})}
                  />
                </View>
                
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>CVV</Text>
                  <View style={styles.cardInputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="123"
                      keyboardType="number-pad"
                      maxLength={3}
                      value={cardDetails.cvv}
                      onChangeText={(text) => setCardDetails({...cardDetails, cvv: text})}
                    />
                    <TouchableOpacity>
                      <Ionicons name="help-circle-outline" size={20} color={COLORS.text.light} style={styles.inputIcon} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              
              <View style={styles.secureInfo}>
                <Ionicons name="lock-closed" size={16} color={COLORS.text.light} />
                <Text style={styles.secureText}>Your payment information is secure</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.payButton}
                onPress={handleCreditCardPayment}
              >
                <Text style={styles.payButtonText}>Pay ₱{total.toFixed(2)}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  // Show loading indicator while fetching cart items
  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Loading cart items...</Text>
      </View>
    );
  }

  // If cart items failed to load
  if (!cartItems) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Failed to load cart items</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchCartItems}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {renderCardModal()}
        
        <View style={styles.paymentBox}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          
          <TouchableOpacity 
            style={[
              styles.paymentOption, 
              paymentMethod === 'cashondelivery' && styles.selectedPayment
            ]}
            onPress={() => setPaymentMethod('cashondelivery')}
          >
            <View style={styles.paymentOptionLeft}>
              <View style={styles.radioButton}>
                {paymentMethod === 'cashondelivery' && <View style={styles.radioButtonSelected} />}
              </View>
              <View>
                <Text style={styles.paymentOptionTitle}>Cash on Delivery</Text>
                <Text style={styles.paymentOptionDescription}>Pay when you receive your order</Text>
              </View>
            </View>
            <Ionicons name="cash-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.paymentOption, 
              paymentMethod === 'creditcard' && styles.selectedPayment
            ]}
            onPress={() => setPaymentMethod('creditcard')}
          >
            <View style={styles.paymentOptionLeft}>
              <View style={styles.radioButton}>
                {paymentMethod === 'creditcard' && <View style={styles.radioButtonSelected} />}
              </View>
              <View>
                <Text style={styles.paymentOptionTitle}>Credit Card</Text>
                <Text style={styles.paymentOptionDescription}>Pay securely with your credit card</Text>
              </View>
            </View>
            <Ionicons name="card-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.orderSummary}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          
          {cartItems.length > 0 ? (
            <View style={styles.cartItemsContainer}>
              {cartItems.map((item, index) => (
                <View key={index} style={styles.cartItem}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.productId?.name || 'Product'}
                  </Text>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                    <Text style={styles.itemPrice}>₱{item.price.toFixed(2)}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyCartText}>Your cart is empty</Text>
          )}
          
          <View style={styles.divider} />
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₱{(total - 40).toFixed(2)}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={styles.summaryValue}>₱40.00</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₱{total.toFixed(2)}</Text>
          </View>
        </View>
        
        <View style={styles.addressContainer}>
          <Text style={styles.sectionTitle}>Shipping Address</Text>
          <View style={styles.addressBox}>
            <Text style={styles.addressName}>{user.name}</Text>
            <Text style={styles.addressText}>{shippingInfo.address}</Text>
            <Text style={styles.addressText}>{shippingInfo.city}, {shippingInfo.postalCode}</Text>
            <Text style={styles.addressText}>{shippingInfo.country}</Text>
            <Text style={styles.addressText}>Phone: {shippingInfo.phoneNo}</Text>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={[
            styles.placeOrderButton,
            (loading || cartItems.length === 0) && styles.disabledButton
          ]}
          onPress={() => {
            if (paymentMethod === 'creditcard') {
              setCardModalVisible(true);
            } else {
              processOrder();
            }
          }}
          disabled={loading || cartItems.length === 0}
        >
          <Text style={styles.placeOrderButtonText}>
            {loading ? 'Processing...' : 'Place Order'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f7f9',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f7f9',
  },
  contentContainer: {
    padding: 12,
    paddingBottom: 80, // Add space for the fixed button at bottom
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7f9',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    color: '#2d6a4f',
  },
  errorText: {
    fontSize: 14,
    color: '#ff3b30',
    textAlign: 'center',
    marginTop: 20,
  },
  retryButton: {
    backgroundColor: '#2d6a4f',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  paymentBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 14,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 10,
  },
  selectedPayment: {
    borderColor: '#2d6a4f',
    backgroundColor: '#e8f5e9',
  },
  paymentOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#2d6a4f',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2d6a4f',
  },
  paymentOptionTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  paymentOptionDescription: {
    fontSize: 11,
    color: '#666',
  },
  orderSummary: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cartItemsContainer: {
    maxHeight: 120,
    marginBottom: 10,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemName: {
    fontSize: 13,
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemQuantity: {
    fontSize: 13,
    color: '#666',
    marginRight: 8,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    minWidth: 60,
    textAlign: 'right',
  },
  emptyCartText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#666',
  },
  summaryValue: {
    fontSize: 13,
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d6a4f',
  },
  addressContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  addressBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  addressName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0, 
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  placeOrderButton: {
    backgroundColor: '#2d6a4f',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#bdbdbd',
  },
  placeOrderButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  modalContent: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#555',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    marginBottom: 14,
    paddingRight: 35, // Make room for icon if needed
  },
  cardInputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    right: 10,
    top: -38,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputHalf: {
    width: '48%',
  },
  secureInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  secureText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  payButton: {
    backgroundColor: '#2d6a4f',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  }
});

export default Payment;