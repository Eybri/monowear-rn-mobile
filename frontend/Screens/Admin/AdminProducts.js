import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
  Modal,
  TextInput,
  Alert,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import baseURL from '../../assets/common/baseurl';
import ProductModal from '../../Screens/Modal/ProductModal';

const { width } = Dimensions.get('window');

const AdminProducts = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('jwt');
      
      const response = await fetch(`${baseURL}/admin/products`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      console.log('Products fetched:', data.products);
      setProducts(data.products);
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', error.message || 'Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const fetchCategories = async () => {
    try {
      const token = await AsyncStorage.getItem('jwt');
      
      const response = await fetch(`${baseURL}/admin/categories`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      
      const data = await response.json();
      console.log('Categories API response:', data);
      
      // Handle the specific response format from your API
      if (data.success && data.category) {
        setCategories(data.category);
      } else if (Array.isArray(data)) {
        setCategories(data);
      } else {
        console.error('Unexpected categories format:', data);
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert('Error', 'Failed to load categories');
    }
  };  
  const handleDeleteProduct = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('jwt');
      
      const response = await fetch(`${baseURL}/admin/product/${productToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      Alert.alert('Success', 'Product deleted successfully');
      fetchProducts();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to delete product');
    } finally {
      setLoading(false);
      setDeleteModalVisible(false);
    }
  };
  
  const handleAddProduct = () => {
    setSelectedProduct(null);
    setProductModalVisible(true);
  };
  
  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setProductModalVisible(true);
  };
  
  const handleSubmitProduct = async (productData) => {
    try {
      const token = await AsyncStorage.getItem('jwt');
      
      // Prepare the API endpoint and method based on operation type
      const isEdit = !!selectedProduct;
      const url = isEdit 
        ? `${baseURL}/admin/product/${selectedProduct._id}`
        : `${baseURL}/admin/product/new`;
      const method = isEdit ? 'PUT' : 'POST';
      
      const formData = new FormData();
      
      // Add all the text fields
      formData.append('name', productData.name);
      formData.append('price', productData.price.toString());
      formData.append('description', productData.description);
      formData.append('category', productData.category);
      formData.append('stock', productData.stock.toString());
      
      // Add color if provided
      if (productData.color) {
        formData.append('color', productData.color);
      }
      
      // Add images if any
      if (productData.images && productData.images.length > 0) {
        productData.images.forEach((image, index) => {
          formData.append('images', image);
        });
      }
      
      console.log('Submitting product with data:', {
        url,
        method,
        category: productData.category,
        color: productData.color,
      });
      
      // Make the API request
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save product');
      }
      
      // Show success message
      Alert.alert(
        'Success', 
        isEdit ? 'Product updated successfully' : 'Product created successfully'
      );
      
      // Refresh the product list
      fetchProducts();
      
    } catch (error) {
      console.error('Error saving product:', error);
      throw error; // Rethrow to be handled by the modal
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
  };

  useEffect(() => {
    fetchCategories(); // Fetch categories right away
    
    const unsubscribe = navigation.addListener('focus', () => {
      fetchProducts();
    });
    
    return unsubscribe;
  }, [navigation]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Color indicator component
  const ColorIndicator = ({ color }) => {
    if (!color) return null;
    
    return (
      <View 
        style={{
          width: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: color,
          borderWidth: 1,
          borderColor: '#e0e0e0',
          marginRight: 6
        }}
      />
    );
  };

  const renderProduct = ({ item }) => {
    const isExpanded = expandedId === item._id;
    
    return (
      <View style={styles.productCard}>
        <TouchableOpacity 
          style={styles.productHeader}
          onPress={() => setExpandedId(isExpanded ? null : item._id)}
          activeOpacity={0.8}
        >
          <View style={styles.productImageContainer}>
            {item.images && item.images[0]?.url ? (
              <Image 
                source={{ uri: item.images[0].url }} 
                style={styles.productImage}
                resizeMode="contain"
              />
            ) : (
              <View style={[styles.productImage, styles.noImage]}>
                <Ionicons name="image-outline" size={24} color="#ccc" />
              </View>
            )}
          </View>
          
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
              <Text style={styles.productPrice}>₱{item.price.toFixed(2)}</Text>
              {item.color && <ColorIndicator color={item.color} />}
            </View>
            <Text style={styles.productStock}>Stock: {item.stock}</Text>
          </View>
          
          <Ionicons 
            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color="#5a8c6e" 
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category:</Text>
              <Text style={styles.detailValue}>{item.category?.name || 'N/A'}</Text>
            </View>
            {item.color && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Color:</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ColorIndicator color={item.color} />
                  <Text style={styles.detailValue}>
                    {item.color.charAt(0).toUpperCase() + item.color.slice(1)}
                  </Text>
                </View>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Description:</Text>
              <Text style={styles.detailValue} numberOfLines={3}>
                {item.description || 'No description'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Created:</Text>
              <Text style={styles.detailValue}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.editButton]}
                onPress={() => handleEditProduct(item)}
              >
                <Ionicons name="create-outline" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Edit</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => {
                  setProductToDelete(item._id);
                  setDeleteModalVisible(true);
                }}
              >
                <Ionicons name="trash-outline" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (loading && products.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2d6a4f" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Product Management</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddProduct}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2d6a4f']}
            tintColor="#2d6a4f"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        }
      />

      {/* Delete Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Delete Product</Text>
            <Text style={styles.modalText}>Are you sure you want to delete this product? This action cannot be undone.</Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmDeleteButton]}
                onPress={handleDeleteProduct}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalButtonText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Product Modal for Add/Edit */}
      <ProductModal
        visible={productModalVisible}
        onClose={() => setProductModalVisible(false)}
        onSubmit={handleSubmitProduct}
        product={selectedProduct}
        categories={categories}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fff8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fff8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a3e23',
  },
  addButton: {
    backgroundColor: '#2d6a4f',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 12,
    height: 45,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#333',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  productImageContainer: {
    width: 60,
    height: 60,
    marginRight: 12,
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
  },
  noImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  productInfo: {
    flex: 1,
    marginRight: 10,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: '#2d6a4f',
    fontWeight: '700',
    marginBottom: 4,
  },
  productStock: {
    fontSize: 12,
    color: '#666',
  },
  expandedContent: {
    padding: 12,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  detailRow: {
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '400',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    width: '48%',
  },
  editButton: {
    backgroundColor: '#5a8c6e',
  },
  deleteButton: {
    backgroundColor: '#d32f2f',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: width - 40,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 15,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  confirmDeleteButton: {
    backgroundColor: '#d32f2f',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AdminProducts;