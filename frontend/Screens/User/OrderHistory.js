import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Modal } from 'react-native';
import { FontAwesome, MaterialIcons, AntDesign } from '@expo/vector-icons';
import { Card, Rating, Input } from 'react-native-elements';
import Toast from 'react-native-toast-message';
import moment from 'moment';
import baseURL from "../../assets/common/baseurl";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const Colors = {
  primary: '#8e44ad',
  secondary: '#9b59b6', 
  success: '#2ecc71',
  danger: '#e74c3c',
  warning: '#f39c12',
  info: '#3498db',
  light: '#f8f9fa',
  dark: '#343a40',
  white: '#ffffff',
  muted: '#6c757d',
  backgroundLight: '#f5f5f5',
  border: '#e1e1e1',
  textDark: '#2c3e50',
  textMuted: '#6c757d',
  textLight: '#95a5a6',
  shadow: 'rgba(0,0,0,0.1)',
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
      const response = await fetch(`${baseURL}/orders`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();
      setOrders(data.orders);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load your orders',
        position: 'bottom'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUserReviews = async () => {
    try {
      const token = await AsyncStorage.getItem("jwt");
      const response = await fetch(`${baseURL}/reviews/all`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch reviews");
      }

      const data = await response.json();
      setUserReviews(data.reviews);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load your reviews',
        position: 'bottom'
      });
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
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to cancel order',
        position: 'bottom'
      });
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
// Update the handleRatePress function to pass the correct product ID
const handleRatePress = (product, orderId) => {
  setSelectedProduct(product);
  setSelectedOrderId(orderId);
  setRating(0);
  setComment('');
  setModalVisible(true);
};

// Update the submitReview function to ensure productId is properly sent
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
    
    // Create JSON data
    const reviewData = {
      rating: rating,
      comment: comment,
      productId: selectedProduct._id,
      orderId: selectedOrderId
    };
    
    console.log('Sending review data:', reviewData); // Debug log
    
    const response = await fetch(`${baseURL}/reviews`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(reviewData)
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
      Completed: { color: Colors.success, icon: 'check-circle', text: 'Completed' }
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
            <Text style={styles.reviewedText}>Reviewed</Text>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.rateButton}
            onPress={() => handleRatePress(product.productId, item._id)}
          >
            <MaterialIcons name="rate-review" size={16} color="white" />
            <Text style={styles.buttonText}>Rate</Text>
          </TouchableOpacity>
        )}
      </View>
    )}
  </View>
))}
            <Text style={styles.sectionTitle}>Shipping Address</Text>
            <Text style={styles.addressText}>
              {item.shippingAddress?.address}, {item.shippingAddress?.city}, {item.shippingAddress?.postalCode}, {item.shippingAddress?.country}
            </Text>

            <Text style={styles.sectionTitle}>Payment Method</Text>
            <Text style={styles.paymentMethod}>
              {item.paymentMethod === 'cashondelivery' ? 'Cash on Delivery' : 'Credit Card'}
            </Text>

            {item.status === 'Cancelled' && item.note && (
              <>
                <Text style={[styles.sectionTitle, { color: Colors.danger }]}>Cancellation Note</Text>
                <Text style={styles.cancellationNote}>{item.note}</Text>
              </>
            )}

            {canCancel && (
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => handleCancelOrder(item._id)}
              >
                <MaterialIcons name="cancel" size={18} color="white" />
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
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="shopping-bag" size={48} color={Colors.muted} />
        <Text style={styles.emptyText}>No orders to show</Text>
        <Text style={styles.emptySubtext}>Please login to view your orders</Text>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.actionButtonText}>Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="shopping-bag" size={48} color={Colors.muted} />
        <Text style={styles.emptyText}>No orders yet</Text>
        <Text style={styles.emptySubtext}>Start shopping to see your orders here</Text>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Products')}
        >
          <Text style={styles.actionButtonText}>Browse Products</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={36} color={Colors.danger} />
        <Text style={styles.errorText}>Failed to load orders</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchUserOrders}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Your Order History</Text>
      
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
                imageSize={30}
                onFinishRating={setRating}
                style={styles.rating}
              />
            </View>
            
            <Input
              placeholder="Write your review here..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={comment}
              onChangeText={setComment}
              containerStyle={styles.inputContainer}
              inputContainerStyle={styles.textInput}
              inputStyle={styles.reviewText}
            />
            
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={submitReview}
              disabled={reviewLoading}
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
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
    padding: 10,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    marginVertical: 16,
    letterSpacing: 1,
  },
  listContainer: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.textDark,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.danger,
    fontWeight: 'bold',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    color: Colors.textDark,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 20,
  },
  actionButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  actionButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  orderCard: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 0,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textDark,
  },
  orderDate: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusIcon: {
    marginRight: 5,
  },
  statusText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  itemCount: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  expandButtonText: {
    fontSize: 14,
    color: Colors.primary,
    marginRight: 5,
  },
  expandedContent: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textDark,
    marginBottom: 8,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    color: Colors.textDark,
  },
  productDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  productQty: {
    fontSize: 14,
    color: Colors.textDark,
    marginRight: 8,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textDark,
  },
  addressText: {
    fontSize: 14,
    color: Colors.textDark,
    marginBottom: 12,
  },
  paymentMethod: {
    fontSize: 14,
    color: Colors.textDark,
    marginBottom: 12,
  },
  cancellationNote: {
    fontSize: 14,
    color: Colors.danger,
    fontStyle: 'italic',
    marginBottom: 12,
    padding: 10,
    backgroundColor: 'rgba(231,76,60,0.1)',
    borderRadius: 8,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.danger,
    marginTop: 15,
  },
  reviewContainer: {
    marginLeft: 10,
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.info,
  },
  reviewedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.success,
  },
  reviewedText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  buttonText: {
    color: Colors.white,
    fontWeight: 'bold',
    marginLeft: 5,
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textDark,
    marginBottom: 5,
    textAlign: 'center',
  },
  productTitle: {
    fontSize: 16,
    color: Colors.textDark,
    marginBottom: 15,
    textAlign: 'center',
  },
  ratingContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  rating: {
    paddingVertical: 10,
  },
  inputContainer: {
    marginTop: 15,
    paddingHorizontal: 0,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    minHeight: 100,
  },
  reviewText: {
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default UserOrderHistory;