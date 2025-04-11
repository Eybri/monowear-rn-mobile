import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  Dimensions,
  ActivityIndicator
} from 'react-native';
import ProductCard from './ProductCard'; // Import ProductCard component
import { useSelector, useDispatch } from 'react-redux';
import { getProducts } from '../../Redux/Actions/Product.actions';

const { width } = Dimensions.get('window');

const Home = ({ navigation }) => {
  const dispatch = useDispatch();
  const { products, loading } = useSelector(state => state.product);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  
  // Fetch products on component mount
  useEffect(() => {
    dispatch(getProducts(1, { featured: true }));
  }, [dispatch]);
  
  // Filter featured products once data is loaded
  useEffect(() => {
    if (products && products.length > 0) {
      // Get first 10 products for the collection slider
      setFeaturedProducts(products.slice(0, 10));
    }
  }, [products]);

  const renderProductItem = (item) => {
    return (
      <View style={styles.productCardWrapper} key={item._id}>
        <ProductCard 
          product={item} 
          navigation={navigation}
          onAddToWishlist={(productId) => {
            // Handle wishlist functionality
            console.log('Add to wishlist:', productId);
          }}
        />
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Banner Section - VARSITY DROP 02 */}
      <View style={styles.bannerContainer}>
        <Image 
            source={require('../../assets/wall.jpg')}  // adjust path based on your file structure
            style={styles.productImage}
            resizeMode="cover"
          />
        <View style={styles.bannerOverlay}>
          <Text style={styles.bannerTitle}>VARSITY</Text>
          <Text style={styles.bannerTitle}>DROP 02</Text>
          <TouchableOpacity style={styles.bannerButton}>
            <Text style={styles.bannerButtonText}>LIVE NOW</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Featured Products Section */}
      <View style={styles.productsContainer}>
        {/* Product 1 */}
        <View style={styles.productItem}>
          <Image 
            source={require('../../assets/drip.jpg')}  // adjust path based on your file structure
            style={styles.productImage}
            resizeMode="cover"
          />
          <Text style={styles.productName}>WOMEN'S BRALETTE</Text>
          <Text style={styles.productPrice}>₱990.00</Text>
        </View>
        
        {/* Product 2 */}
        <View style={styles.productItem}>
          <Image 
            source={require('../../assets/drip2.jpg')}  // adjust path based on your file structure
            style={styles.productImage}
            resizeMode="cover"
          />
          <Text style={styles.productName}>MEN'S BOXER BRIEFS</Text>
          <Text style={styles.productPrice}>₱990.00</Text>
        </View>
      </View>

      {/* Collections Section - Using ProductCard */}
      <View style={styles.additionalContent}>
        <Text style={styles.sectionTitle}>COLLECTIONS</Text>
        
        {loading ? (
          <ActivityIndicator size="small" color="#000" style={styles.loader} />
        ) : (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.collectionsScroll}
            contentContainerStyle={styles.collectionsScrollContent}
          >
            {featuredProducts.map(product => renderProductItem(product))}
          </ScrollView>
        )}
        
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => navigation.navigate('Products')}
        >
          <Text style={styles.viewAllText}>VIEW ALL PRODUCTS</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  bannerContainer: {
    position: 'relative',
    height: 250,
    width: '100%',
  },
  bannerImage: {
    height: '100%',
    width: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  bannerTitle: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 5,
  },
  bannerButton: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  bannerButtonText: {
    color: '#333',
    fontSize: 14,
    letterSpacing: 1,
  },
  productsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  productItem: {
    width: (width - 40) / 2,
  },
  productImage: {
    width: '100%',
    height: width / 2,
    marginBottom: 8,
  },
  productName: {
    fontSize: 12,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  additionalContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    letterSpacing: 1,
  },
  collectionsScroll: {
    flexDirection: 'row',
  },
  collectionsScrollContent: {
    paddingRight: 16,
  },
  productCardWrapper: {
    width: 150,
    marginRight: 12,
  },
  loader: {
    marginVertical: 20,
  },
  viewAllButton: {
    marginTop: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: '#000',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  }
});

export default Home;