import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ProductCard = ({ product, navigation, onAddToWishlist }) => {
  const isOutOfStock = product.stock <= 0;
  
  return (
    <View style={styles.cardContainer}>
        <TouchableOpacity 
          style={styles.card}
          onPress={() => {
            navigation.navigate('ProductDetail', { 
              productId: product._id,
              productName: product.name 
            });
          }}
        >
        {/* Image Container with Badges */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: product.images[0]?.url }} 
            style={styles.image}
            resizeMode="cover"
          />
          
          {/* Sold Out Badge (top left) */}
          {isOutOfStock && (
            <View style={styles.soldOutBadge}>
              <Text style={styles.soldOutText}>SOLD OUT</Text>
            </View>
          )}
          
          {/* Wishlist Heart (top right) */}
          <TouchableOpacity 
            style={styles.wishlistButton} 
            onPress={(e) => {
              e.stopPropagation();
              onAddToWishlist && onAddToWishlist(product._id);
            }}
          >
            <Ionicons name="heart-outline" size={22} color="#4CAF50" />
          </TouchableOpacity>
        </View>
        
        {/* Product Details */}
        <View style={styles.details}>
          <Text style={styles.description} numberOfLines={2}>{product.description}</Text>
          <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
          <Text style={styles.price}>₱{product.price.toFixed(2)}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1, // Makes cards flexible in grid
    padding: 6, // Adjust padding as needed
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    aspectRatio: 1, // Square images
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f8f8f8',
  },
  soldOutBadge: {
    position: 'absolute',
    top: 10,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  soldOutText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    color: '#fff',
    textAlign: 'center',
  },
  wishlistButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'transparent', // Changed to transparent
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    padding: 10,
    alignItems: 'center',
  },
  productName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  description: {
    fontSize: 11,
    color: '#666',
    marginBottom: 6,
    textAlign: 'center',
    lineHeight: 16,
  },
  price: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default ProductCard;