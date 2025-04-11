import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Modal } from 'react-native';
import { FontAwesome, MaterialIcons, AntDesign } from '@expo/vector-icons';
import { Card, Rating, Input } from 'react-native-elements';
import Toast from 'react-native-toast-message';
import moment from 'moment';
import baseURL from "../../assets/common/baseurl";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

// Enhanced color palette with more depth
const Colors = {
  primary: '#1E7F4C',       // Deeper dark pastel green
  primaryLight: '#2CAB6F',  // Medium pastel green
  primaryLighter: '#A8EBCF', // Light pastel green with more saturation
  secondary: '#446141',     // Deep forest green
  accent: '#83C48A',        // Muted pastel green
  success: '#4CAF50',
  danger: '#E53935',
  warning: '#FFAB00',
  info: '#0288D1',
  light: '#F8FAF7',         // Very light green tint
  dark: '#1F2D20',          // Very dark green
  white: '#FFFFFF',
  muted: '#9E9E9E',
  backgroundLight: '#F5FFF8', // Light green tinted background
  border: '#DAEBD7',        // Light green border
  textDark: '#1A2A1B',      // Very dark green text
  textMuted: '#6B7D6C',     // Muted green text
  textLight: '#B5C9B7',     // Light green text
  shadow: 'rgba(30,127,76,0.15)', // Green tinted shadow
  cardBackground: '#FFFFFF',
  statusBadgeShadow: 'rgba(0,0,0,0.1)',
};

const UserOrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userReviews, setUserReviews] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const token = await AsyncStorage.getItem("jwt");
      setIsAuthenticated(!!token);
      if (token) {
        fetchUserOrders();
        fetchUserReviews();
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error('Error checking authentication:', err);
      setLoading(false);
    }
  };

  const fetchUserOrders = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("jwt");
      
      if (!token) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
  
      const response = await fetch(`${baseURL}/orders`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        },
      });
  
      if (response.status === 401) {
        // JWT is invalid or expired
        await AsyncStorage.removeItem("jwt");
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
  
      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }
  
      const data = await response.json();
      setOrders(data.orders);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      
      if (err.message.includes('jwt') || err.message.includes('token')) {
        // Handle JWT related errors
        await AsyncStorage.removeItem("jwt");
        setIsAuthenticated(false);
      } else {
        setError(err.message);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to load your orders',
          position: 'bottom'
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUserReviews = async () => {
    try {
      const token = await AsyncStorage.getItem("jwt");
      
      if (!token) {
        return;
      }
  
      const response = await fetch(`${baseURL}/reviews/all`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        },
      });
  
      if (response.status === 401) {
        // JWT is invalid or expired
        await AsyncStorage.removeItem("jwt");
        setIsAuthenticated(false);
        return;
      }
  
      if (!response.ok) {
        throw new Error("Failed to fetch reviews");
      }
  
      const data = await response.json();
      setUserReviews(data.reviews);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      
      if (err.message.includes('jwt') || err.message.includes('token')) {
        // Handle JWT related errors
        await AsyncStorage.removeItem("jwt");
        setIsAuthenticated(false);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to load your reviews',
          position: 'bottom'
        });
      }
    }
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    fetchUserOrders();
    fetchUserReviews();
  };

  const handleCancelOrder = async (orderId) => {
    try {
      Alert.alert(
        'Confirm Cancellation',
        'Are you sure you want to cancel this order?',
        [
          {
            text: 'No',
            style: 'cancel',
          },
          {
            text: 'Yes',
            onPress: async () => {
              setLoading(true);
              const token = await AsyncStorage.getItem("jwt");
              
              if (!token) {
                setIsAuthenticated(false);
                setLoading(false);
                return;
              }
  
              const response = await fetch(`${baseURL}/orders/update`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                  orderId,
                  status: 'Cancelled',
                  note: 'Cancelled by user'
                })
              });
  
              if (response.status === 401) {
                // JWT is invalid or expired
                await AsyncStorage.removeItem("jwt");
                setIsAuthenticated(false);
                setLoading(false);
                return;
              }
  
              if (!response.ok) {
                throw new Error("Failed to cancel order");
              }
  
              const updatedOrder = await response.json();
              setOrders(orders.map(order => 
                order._id === orderId ? updatedOrder.order : order
              ));
              
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Order cancelled successfully',
                position: 'bottom'
              });
            },
          },
        ],
        { cancelable: false }
      );
    } catch (err) {
      console.error('Error cancelling order:', err);
      
      if (err.message.includes('jwt') || err.message.includes('token')) {
        // Handle JWT related errors
        await AsyncStorage.removeItem("jwt");
        setIsAuthenticated(false);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to cancel order',
          position: 'bottom'
        });
      }
    } finally {
      setLoading(false);
    }
  };
  
  const toggleOrderDetails = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const isReviewed = (productId, orderId) => {
    return userReviews.some(review => 
      review.product._id === productId && review.order._id === orderId
    );
  };

  const handleRatePress = (product, orderId) => {
    setSelectedProduct(product);
    setSelectedOrderId(orderId);
    setRating(0);
    setComment('');
    setModalVisible(true);
  };

  const submitReview = async () => {
    if (rating === 0) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select a rating',
        position: 'bottom'
      });
      return;
    }
  
    try {
      setReviewLoading(true);
      const token = await AsyncStorage.getItem("jwt");
      
      // Create JSON data instead of FormData
      const reviewData = {
        rating: rating,
        comment: comment,
        productId: selectedProduct._id,
        orderId: selectedOrderId
      };
      
      const response = await fetch(`${baseURL}/reviews`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json" // Set Content-Type to JSON
        },
        body: JSON.stringify(reviewData) // Send JSON string
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit review");
      }
  
      // Refresh user reviews
      await fetchUserReviews();
      
      setModalVisible(false);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Review submitted successfully',
        position: 'bottom'
      });
    } catch (err) {
      console.error('Error submitting review:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message || 'Failed to submit review',
        position: 'bottom'
      });
    } finally {
      setReviewLoading(false);
    }
  };
  
  const renderOrderStatus = (status) => {
    let statusConfig = {
      Pending: { color: Colors.warning, icon: 'clock-o', text: 'Processing' },
      Shipped: { color: Colors.info, icon: 'truck', text: 'Shipped' },
      Delivered: { color: Colors.success, icon: 'check-circle', text: 'Delivered' },
      Cancelled: { color: Colors.danger, icon: 'times-circle', text: 'Cancelled' },
      Completed: { color: Colors.primaryLight, icon: 'check-circle', text: 'Completed' }
    };

    const config = statusConfig[status] || { 
      color: Colors.dark, 
      icon: 'question-circle', 
      text: 'Unknown' 
    };

    return (
      <View style={[styles.statusBadge, { backgroundColor: config.color }]}>
        <FontAwesome name={config.icon} size={14} color="white" style={styles.statusIcon} />
        <Text style={styles.statusText}>{config.text}</Text>
      </View>
    );
  };
  
  const renderOrderItem = ({ item }) => {
    const isExpanded = expandedOrderId === item._id;
    const orderDate = moment(item.createdAt).format('MMM D, YYYY [at] h:mm A');
    const canCancel = item.status === 'Pending';
    const canReview = item.status === 'Delivered';

    return (
      <Card containerStyle={styles.orderCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderId}>Order #{item._id.slice(-8)}</Text>
            <Text style={styles.orderDate}>{orderDate}</Text>
          </View>
          {renderOrderStatus(item.status)}
        </View>

        <View style={styles.orderSummary}>
          <Text style={styles.orderTotal}>₱{item.totalPrice.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</Text>
          <Text style={styles.itemCount}>{item.products.length} {item.products.length === 1 ? 'item' : 'items'}</Text>
        </View>

        <TouchableOpacity 
          onPress={() => toggleOrderDetails(item._id)} 
          style={styles.expandButton}
          activeOpacity={0.8}
        >
          <Text style={styles.expandButtonText}>
            {isExpanded ? 'Hide Details' : 'View Details'}
          </Text>
          <MaterialIcons 
            name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} 
            size={22} 
            color={Colors.primary} 
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedContent}>
            <Text style={styles.sectionTitle}>Order Items</Text>
            {item.products.map((product, index) => (
              <View key={index} style={styles.productItem}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.productId?.name || 'Unknown Product'}</Text>
                  <View style={styles.productDetails}>
                    <View style={[styles.colorIndicator, { backgroundColor: product.color || '#ddd' }]} />
                    <Text style={styles.productQty}>{product.quantity}x</Text>
                    <Text style={styles.productPrice}>₱{product.price.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</Text>
                  </View>
                </View>
                
                {canReview && (
                  <View style={styles.reviewContainer}>
                    {isReviewed(product.productId?._id, item._id) ? (
                      <View style={styles.reviewedBadge}>
                        <FontAwesome name="check" size={12} color={Colors.white} style={{marginRight: 4}} />
                        <Text style={styles.reviewedText}>Reviewed</Text>
                      </View>
                    ) : (
                      <TouchableOpacity 
                        style={styles.rateButton}
                        onPress={() => handleRatePress(product.productId, item._id)}
                        activeOpacity={0.8}
                      >
                        <MaterialIcons name="rate-review" size={16} color="white" style={{marginRight: 6}} />
                        <Text style={styles.buttonText}>Rate</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            ))}

            <Text style={styles.sectionTitle}>Shipping Address</Text>
            <View style={styles.infoBox}>
              <Text style={styles.addressText}>
                {item.shippingAddress?.address}, {item.shippingAddress?.city}, {item.shippingAddress?.postalCode}, {item.shippingAddress?.country}
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Payment Method</Text>
            <View style={styles.infoBox}>
              <Text style={styles.paymentMethod}>
                {item.paymentMethod === 'cashondelivery' ? 'Cash on Delivery' : 'Credit Card'}
              </Text>
            </View>

            {item.status === 'Cancelled' && item.note && (
              <>
                <Text style={[styles.sectionTitle, { color: Colors.danger }]}>Cancellation Note</Text>
                <View style={[styles.infoBox, styles.cancellationBox]}>
                  <Text style={styles.cancellationNote}>{item.note}</Text>
                </View>
              </>
            )}

            {canCancel && (
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => handleCancelOrder(item._id)}
                activeOpacity={0.8}
              >
                <MaterialIcons name="cancel" size={18} color="white" style={{marginRight: 8}} />
                <Text style={styles.buttonText}>Cancel Order</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading your orders...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.authContainer}>
        <View style={styles.authContent}>
          <MaterialIcons name="lock" size={60} color={Colors.primary} style={styles.authIcon} />
          <Text style={styles.authTitle}>Login Required</Text>
          <Text style={styles.authSubtitle}>Please login to view your order history</Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.signupButton}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.8}
          >
            <Text style={styles.signupButtonText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  if (orders.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="shopping-bag" size={60} color={Colors.muted} />
        <Text style={styles.emptyText}>No orders yet</Text>
        <Text style={styles.emptySubtext}>Start shopping to see your orders here</Text>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Products')}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonText}>Browse Products</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={45} color={Colors.danger} />
        <Text style={styles.errorText}>Failed to load orders</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={fetchUserOrders}
          activeOpacity={0.8}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.pageTitle}>Your Order History</Text>
        <Text style={styles.pageSubtitle}>{orders.length} {orders.length === 1 ? 'order' : 'orders'} found</Text>
      </View>
      
      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
        showsVerticalScrollIndicator={false}
      />

      {/* Review Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
              activeOpacity={0.8}
            >
              <AntDesign name="close" size={24} color={Colors.dark} />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>Rate Product</Text>
            {selectedProduct && (
              <Text style={styles.productTitle}>{selectedProduct.name}</Text>
            )}
            
            <View style={styles.ratingContainer}>
              <Rating
                showRating
                type="star"
                startingValue={rating}
                imageSize={32}
                onFinishRating={setRating}
                style={styles.rating}
                tintColor={Colors.white}
                ratingColor={Colors.warning}
                ratingBackgroundColor={Colors.border}
              />
            </View>
            
            <Input
              placeholder="Share your experience with this product..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={comment}
              onChangeText={setComment}
              containerStyle={styles.inputContainer}
              inputContainerStyle={styles.textInput}
              inputStyle={styles.reviewText}
              placeholderTextColor={Colors.textMuted}
            />
            
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={submitReview}
              disabled={reviewLoading}
              activeOpacity={0.8}
            >
              {reviewLoading ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>Submit Review</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  // Enhanced container styles with shadow and depth
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
    padding: 16,
  },
  headerContainer: {
    marginVertical: 16,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.dark,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  pageSubtitle: {
    fontSize: 15,
    color: Colors.textMuted,
    marginTop: 4,
  },
  listContainer: {
    paddingBottom: 20,
  },
  orderCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 18,
    borderWidth: 0,
    backgroundColor: Colors.cardBackground,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderId: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.dark,
    letterSpacing: 0.3,
  },
  orderDate: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: Colors.statusBadgeShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  statusIcon: {
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  orderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginBottom: 12,
  },
  orderTotal: {
    fontSize: 19,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  itemCount: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.primaryLighter,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  expandButtonText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    marginRight: 8,
    letterSpacing: 0.3,
  },
  expandedContent: {
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
    marginTop: 14,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  infoBox: {
    backgroundColor: Colors.light,
    padding: 14,
    borderRadius: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  cancellationBox: {
    backgroundColor: 'rgba(244,67,54,0.05)',
    borderLeftWidth: 3,
    borderLeftColor: Colors.danger,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginVertical: 6,
    backgroundColor: Colors.light,
    borderRadius: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  productInfo: {
    flex: 1,
    marginRight: 10,
  },
  productName: {
    fontSize: 15,
    color: Colors.textDark,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  productDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  productQty: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textMuted,
    marginRight: 8,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  reviewContainer: {
    marginLeft: 4,
  },
  reviewedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 1,
  },
  reviewedText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.white,
    letterSpacing: 0.3,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: Colors.danger,
    marginTop: 18,
    shadowColor: 'rgba(244,67,54,0.35)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  addressText: {
    fontSize: 14,
    color: Colors.textDark,
    lineHeight: 22,
  },
  paymentMethod: {
    fontSize: 14,
    color: Colors.textDark,
    fontWeight: '500',
  },
  cancellationNote: {
    fontSize: 14,
    color: Colors.danger,
    fontWeight: '500',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  
  // Auth styles with more depth
  authContainer: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
});

export default UserOrderHistory;