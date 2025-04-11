import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Alert,
  FlatList,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { Rating } from 'react-native-ratings';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import baseURL from '../../assets/common/baseurl'; // Your base URL
import { useNavigation } from '@react-navigation/native'; // Import useNavigation

const OrderReviews = () => {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [formData, setFormData] = useState({
    rating: 0,
    comment: '',
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigation = useNavigation(); // Initialize navigation

  const getToken = async () => {
    const token = await AsyncStorage.getItem('jwt');
    setIsAuthenticated(!!token);
    return token;
  };

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const token = await getToken();
        
        if (!token) {
          setLoading(false);
          return;
        }

        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        const response = await axios.get(`${baseURL}/reviews/all`, config);
        setReviews(response.data.reviews);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load reviews');
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const handleEdit = (review) => {
    setSelectedReview(review);
    setFormData({
      rating: review.rating,
      comment: review.comment,
    });
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedReview(null);
    setFormData({ rating: 0, comment: '' });
  };

  const handleUpdateReview = async () => {
    try {
      const token = await getToken();
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      await axios.put(
        `${baseURL}/reviews/${selectedReview._id}`,
        formData,
        config
      );

      // Update local state
      const updatedReviews = reviews.map((review) =>
        review._id === selectedReview._id
          ? { ...review, ...formData }
          : review
      );
      setReviews(updatedReviews);

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Review updated successfully!',
      });
      handleCloseModal();
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.response?.data?.message || 'Failed to update review',
      });
    }
  };

  const handleDelete = async (reviewId) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this review?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              const token = await getToken();
              const config = {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              };

              await axios.delete(`${baseURL}/reviews/${reviewId}`, config);

              setReviews(reviews.filter((review) => review._id !== reviewId));
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Review deleted successfully!',
              });
            } catch (err) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: err.response?.data?.message || 'Failed to delete review',
              });
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const renderReviewItem = ({ item }) => (
    <View style={styles.reviewCard}>
      <Text style={styles.productName}>{item.product.name}</Text>
      
      <View style={styles.ratingContainer}>
        <Rating
          type="star"
          ratingCount={5}
          imageSize={20}
          readonly
          startingValue={item.rating}
          tintColor="#1a2e35"
        />
        <Text style={styles.ratingText}>{item.rating.toFixed(1)} ★</Text>
      </View>
      
      <Text style={styles.priceText}>
        Price: ₱{item.product.price.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
      </Text>
      
      <Text style={styles.colorText}>
        Color: {item.order.products.find(
          (p) => p.productId._id === item.product._id
        )?.color || 'N/A'}
      </Text>
      
      <Text style={styles.commentText}>{item.comment}</Text>
      
      {item.images.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {item.images.map((img) => (
            <Image
              key={img.public_id}
              source={{ uri: img.url }}
              style={styles.reviewImage}
            />
          ))}
        </ScrollView>
      )}
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEdit(item)}
        >
          <Icon name="edit" size={20} color="#f0f7f4" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(item._id)}
        >
          <Icon name="delete" size={20} color="#f0f7f4" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5e8c7f" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.authContainer}>
        <Icon name="lock" size={50} color="#5e8c7f" />
        <Text style={styles.authText}>Please login to view your reviews</Text>
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <Text style={styles.headerTitle}>Your Reviews</Text>
        
        {reviews.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="rate-review" size={50} color="#5e8c7f" />
            <Text style={styles.emptyText}>No reviews yet</Text>
          </View>
        ) : (
          <FlatList
            data={reviews}
            renderItem={renderReviewItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContainer}
            scrollEnabled={false}
          />
        )}
      </ScrollView>

      {/* Review Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Edit Review</Text>
              
              <Text style={styles.modalProductName}>
                {selectedReview?.product.name}
              </Text>
              
              <Rating
                type="star"
                ratingCount={5}
                imageSize={30}
                startingValue={formData.rating}
                onFinishRating={(rating) => 
                  setFormData({...formData, rating})
                }
                tintColor="#2c4a52"
                style={styles.modalRating}
              />
              
              <TextInput
                style={styles.commentInput}
                placeholder="Your review comment..."
                placeholderTextColor="#a0d6b4"
                multiline
                numberOfLines={4}
                value={formData.comment}
                onChangeText={(text) => 
                  setFormData({...formData, comment: text})
                }
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={handleCloseModal}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.updateButton]}
                  onPress={handleUpdateReview}
                >
                  <Text style={styles.buttonText}>Update</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a2e35',
  },
  scrollContainer: {
    flex: 1,
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a2e35',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a2e35',
    padding: 20,
  },
  authText: {
    color: '#f0f7f4',
    fontSize: 18,
    marginVertical: 20,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#5e8c7f',
    padding: 15,
    borderRadius: 8,
    width: '60%',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#f0f7f4',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a2e35',
    padding: 20,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f0f7f4',
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: '#a0d6b4',
    fontSize: 18,
    marginTop: 10,
  },
  listContainer: {
    paddingBottom: 20,
  },
  reviewCard: {
    backgroundColor: '#2c4a52',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f0f7f4',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    color: '#f0f7f4',
    marginLeft: 8,
    fontSize: 14,
  },
  priceText: {
    color: '#a0d6b4',
    fontSize: 14,
    marginBottom: 5,
  },
  colorText: {
    color: '#a0d6b4',
    fontSize: 14,
    marginBottom: 10,
  },
  commentText: {
    color: '#f0f7f4',
    fontSize: 15,
    marginBottom: 10,
    lineHeight: 22,
  },
  reviewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 10,
    marginBottom: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  actionButton: {
    padding: 8,
    borderRadius: 5,
    marginLeft: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#5e8c7f',
  },
  deleteButton: {
    backgroundColor: '#d64045',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#2c4a52',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f0f7f4',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalProductName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#f0f7f4',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalRating: {
    marginBottom: 20,
    alignSelf: 'center',
  },
  commentInput: {
    backgroundColor: '#3a5a5f',
    borderRadius: 8,
    padding: 12,
    color: '#f0f7f4',
    fontSize: 15,
    marginBottom: 20,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#3a5a5f',
  },
  updateButton: {
    backgroundColor: '#5e8c7f',
  },
  buttonText: {
    color: '#f0f7f4',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default OrderReviews;