import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProductDetails } from '../../Redux/Actions/Product.actions';
import Loading from '../../Shared/Loading';
import Error from '../../Shared/Error';
import { Ionicons } from '@expo/vector-icons';
import baseURL from "../../assets/common/baseurl";

const ProductDetail = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const { productId } = route.params;
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  const { 
    productDetails, 
    productDetailsLoading, 
    productDetailsError 
  } = useSelector(state => state.product);

  const { user, isAuthenticated } = useSelector(state => state.auth);

  useEffect(() => {
    dispatch(getProductDetails(productId));
  }, [dispatch, productId]);

  useEffect(() => {
    if (productDetails?.colors?.length > 0) {
      setSelectedColor(productDetails.colors[0]);
    }
  }, [productDetails]);

  const handleIncreaseQuantity = () => {
    if (quantity < productDetails.stock) {
      setQuantity(quantity + 1);
    }
  };

  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const addToCart = async () => {
    if (!selectedColor) {
      Alert.alert('Please select a color');
      return;
    }
  
    setIsAddingToCart(true);
    
    try {
      const cartItem = {
        productId,
        name: productDetails.name,
        price: productDetails.price,
        color: selectedColor,
        quantity,
        image: productDetails.images[0]?.url,
        stock: productDetails.stock
      };

      if (isAuthenticated && user) {
        // Add to server cart for authenticated users
        await addToServerCart(cartItem);
      } else {
        // Add to local cart for guests
        await addToLocalCart(cartItem);
      }
  
      Alert.alert('Success', 'Item added to cart!');
      navigation.setParams({ refreshCart: Date.now() });
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', error.message || 'Failed to add item to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const addToServerCart = async (item) => {
    try {
      const token = await AsyncStorage.getItem('jwt');
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
        throw new Error(errorData.message || 'Failed to add to server cart');
      }
    } catch (error) {
      throw error;
    }
  };

  const addToLocalCart = async (item) => {
    try {
      const existingCart = await AsyncStorage.getItem('localCart');
      let cart = existingCart ? JSON.parse(existingCart) : [];
      
      // Check if item with same productId AND color exists
      const existingItemIndex = cart.findIndex(
        i => i.productId === item.productId && i.color === item.color
      );
      
      if (existingItemIndex >= 0) {
        // Update quantity if same product+color exists
        const newQuantity = cart[existingItemIndex].quantity + item.quantity;
        
        // Ensure we don't exceed stock
        if (newQuantity <= cart[existingItemIndex].stock) {
          cart[existingItemIndex].quantity = newQuantity;
        } else {
          throw new Error(`Only ${cart[existingItemIndex].stock} available in stock`);
        }
      } else {
        // Add as new item if different product or color
        cart.push({ ...item, localId: `local_${Date.now()}` });
      }
      
      await AsyncStorage.setItem('localCart', JSON.stringify(cart));
    } catch (error) {
      throw error;
    }
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      navigation.navigate('Login', { 
        redirect: 'Checkout', 
        product: { 
          productId, 
          quantity, 
          color: selectedColor 
        } 
      });
      return;
    }
    // Proceed to checkout directly
    navigation.navigate('Checkout', { 
      items: [{
        productId,
        quantity,
        color: selectedColor,
        price: productDetails.price,
        name: productDetails.name
      }]
    });
  };

  if (productDetailsLoading) {
    return <Loading />;
  }

  if (productDetailsError) {
    return <Error message={productDetailsError} />;
  }

  if (!productDetails) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Breadcrumbs */}
      <View style={styles.breadcrumbs}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.breadcrumbLink}>Home</Text>
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={14} color="#999" />
        <TouchableOpacity onPress={() => navigation.navigate('Products')}>
          <Text style={styles.breadcrumbLink}>Shop</Text>
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={14} color="#999" />
        <Text style={styles.breadcrumbCurrent}>{productDetails.name}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: productDetails.images[0]?.url }} 
            style={styles.mainImage}
            resizeMode="contain"
          />
        </View>

        {/* Product Info */}
        <View style={styles.detailsContainer}>
          <Text style={styles.name}>{productDetails.name}</Text>
          
          <View style={styles.priceRatingContainer}>
            <Text style={styles.price}>₱{productDetails.price.toFixed(2)}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>
                {productDetails.averageRating} ({productDetails.numReviews} reviews)
              </Text>
            </View>
          </View>

          <Text style={styles.description}>{productDetails.description}</Text>

          {/* Stock Status */}
          <View style={styles.stockContainer}>
            <Text style={[
              styles.stockText,
              productDetails.stock > 0 ? styles.inStock : styles.outOfStock
            ]}>
              {productDetails.stock > 0 ? 'In Stock' : 'Out of Stock'}
            </Text>
            {productDetails.stock > 0 && (
              <Text style={styles.stockQuantity}>Only {productDetails.stock} left</Text>
            )}
          </View>

          {/* Color Selection */}
          {productDetails.colors && productDetails.colors.length > 0 && (
            <View style={styles.colorsContainer}>
              <Text style={styles.sectionTitle}>COLOR: {selectedColor}</Text>
              <View style={styles.colorOptions}>
                {productDetails.colors.map((color, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.colorOption,
                      { 
                        backgroundColor: color.toLowerCase() === 'black' ? '#000' : color.toLowerCase(),
                        borderColor: color === selectedColor ? '#4CAF50' : '#ddd'
                      }
                    ]}
                    onPress={() => setSelectedColor(color)}
                  >
                    {color === selectedColor && (
                      <Ionicons name="checkmark" size={16} color="#fff" style={styles.colorCheck} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Quantity Control */}
          <View style={styles.quantityContainer}>
            <Text style={styles.sectionTitle}>QUANTITY</Text>
            <View style={styles.quantityControl}>
              <TouchableOpacity 
                style={styles.quantityButton} 
                onPress={handleDecreaseQuantity}
                disabled={quantity <= 1}
              >
                <Ionicons name="remove" size={20} color={quantity <= 1 ? '#ccc' : '#333'} />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity 
                style={styles.quantityButton} 
                onPress={handleIncreaseQuantity}
                disabled={quantity >= productDetails.stock}
              >
                <Ionicons name="add" size={20} color={quantity >= productDetails.stock ? '#ccc' : '#333'} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.buyNowButton]}
            onPress={handleBuyNow}
            disabled={isAddingToCart}
          >
            <Text style={styles.buyNowText}>
              {isAddingToCart ? 'Processing...' : 'BUY IT NOW'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.addToCartButton]}
            onPress={addToCart}
            disabled={isAddingToCart}
          >
            <Text style={styles.buttonText}>
              {isAddingToCart ? 'ADDING...' : 'ADD TO CART'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  breadcrumbs: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  breadcrumbLink: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 4,
  },
  breadcrumbCurrent: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    marginHorizontal: 4,
  },
  imageContainer: {
    width: '100%',
    height: Dimensions.get('window').width * 0.9,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  detailsContainer: {
    padding: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  priceRatingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  price: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#666',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 20,
  },
  stockContainer: {
    marginBottom: 20,
  },
  stockText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  inStock: {
    color: '#4CAF50',
  },
  outOfStock: {
    color: '#F44336',
  },
  stockQuantity: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  colorsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  colorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorCheck: {
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  quantityContainer: {
    marginBottom: 30,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  quantityButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  quantityText: {
    width: 50,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  button: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToCartButton: {
    backgroundColor: '#333',
  },
  buyNowButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#333',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  buyNowText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});

export default ProductDetail;   