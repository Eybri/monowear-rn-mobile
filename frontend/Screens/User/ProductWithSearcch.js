import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProductCard from './ProductCard'; // Import your existing ProductCard

const ProductsWithSearch = ({ products, navigation, onAddToWishlist }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState(products);

  // Update filtered products whenever search query or products change
  useEffect(() => {
    if (!searchQuery.trim()) {
      // If search is empty, show all products
      setFilteredProducts(products);
    } else {
      // Filter products based on search query
      const lowercaseQuery = searchQuery.toLowerCase();
      const filtered = products.filter(product => {
        return (
          product.name.toLowerCase().includes(lowercaseQuery) ||
          product.description.toLowerCase().includes(lowercaseQuery) ||
          (product.category && product.category.name && 
            product.category.name.toLowerCase().includes(lowercaseQuery))
        );
      });
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Search Results Stats */}
      {searchQuery.trim() !== '' && (
        <View style={styles.resultsInfo}>
          <Text style={styles.resultsText}>
            Found {filteredProducts.length} {filteredProducts.length === 1 ? 'result' : 'results'} for "{searchQuery}"
          </Text>
          {filteredProducts.length === 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.showAllButton}>
              <Text style={styles.showAllText}>Show all products</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Product List */}
      <FlatList
        data={filteredProducts}
        renderItem={({ item }) => (
          <ProductCard 
            product={item} 
            navigation={navigation}
            onAddToWishlist={onAddToWishlist}
          />
        )}
        keyExtractor={item => item._id}
        numColumns={2}
        contentContainerStyle={styles.productList}
        style={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={50} color="#ccc" />
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 36,
    fontSize: 14,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  resultsInfo: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  resultsText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  showAllButton: {
    paddingVertical: 4,
  },
  showAllText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  productList: {
    padding: 6,
  },
  list: {
    flex: 1,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  }
});

export default ProductsWithSearch;