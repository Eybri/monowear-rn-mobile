import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  TextInput 
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { getProducts } from '../../Redux/Actions/Product.actions';
import ProductCard from './ProductCard';
import Banner from '../../Shared/Banner';
import FilterModal from '../Modal/FilterModal'; 
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';

const Product = ({ navigation }) => {
  const dispatch = useDispatch();
  const { products, loading, error, filteredProductsCount } = useSelector(state => state.product);
  
  const [state, setState] = useState({
    refreshing: false,
    page: 1,
    filters: {},
    filterModalVisible: false,
    searchQuery: '',
  });

  const [categories, setCategories] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const activeFiltersCount = Object.values(state.filters).filter(Boolean).length;

  const fetchProducts = useCallback(async () => {
    await dispatch(getProducts(state.page, state.filters));
    setState(prev => ({ ...prev, refreshing: false }));
  }, [dispatch, state.page, state.filters]);

  useEffect(() => {
    const uniqueCategories = [...new Set(products
      .filter(p => p.category)
      .map(p => p.category._id))]
      .map(id => products.find(p => p.category?._id === id).category);
    setCategories(uniqueCategories);
  }, [products]);

  useEffect(() => {
    fetchProducts();
  }, [state.page, state.filters, fetchProducts]);

  useEffect(() => {
    if (!state.searchQuery.trim()) {
      setFilteredProducts(products);
    } else {
      const query = state.searchQuery.toLowerCase();
      setFilteredProducts(products.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.category?.name?.toLowerCase().includes(query)
      ));
    }
  }, [state.searchQuery, products]);

  const handleRefresh = () => setState(prev => ({ ...prev, page: 1, refreshing: true }));
  const handleLoadMore = () => {
    if (products.length < filteredProductsCount && !loading) {
      setState(prev => ({ ...prev, page: prev.page + 1 }));
    }
  };
  const handleApplyFilters = (filters) => setState(prev => ({ ...prev, page: 1, filters }));
  const clearSearch = () => setState(prev => ({ ...prev, searchQuery: '' }));

  const renderFooter = () => loading && state.page !== 1 ? (
    <View style={styles.loadingFooter}>
      <ActivityIndicator size="small" color="#000" />
    </View>
  ) : null;

  const Breadcrumb = () => (
    <View style={styles.breadcrumbContainer}>
      <TouchableOpacity onPress={() => navigation.navigate('Home')}>
        <Text style={styles.breadcrumbText}>Home</Text>
      </TouchableOpacity>
      <Ionicons name="chevron-forward" size={14} color="#666" style={styles.chevron} />
      <Text style={[styles.breadcrumbText, styles.currentPage]}>Shop</Text>
    </View>
  );

  const FilterBar = () => (
    <View style={styles.filterBar}>
      <TouchableOpacity 
        style={styles.filterButton}
        onPress={() => setState(prev => ({ ...prev, filterModalVisible: true }))}
      >
        <Ionicons name="funnel-outline" size={18} color="#4CAF50" />
        <Text style={styles.filterButtonText}>Filter</Text>
        {activeFiltersCount > 0 && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
          </View>
        )}
      </TouchableOpacity>
      
      <Text style={styles.resultCount}>
        {state.searchQuery ? filteredProducts.length : filteredProductsCount} 
        {' '}Product{filteredProducts.length !== 1 ? 's' : ''}
      </Text>
    </View>
  );

  if (loading && state.page === 1) return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  if (error) return (
    <View style={styles.centered}>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={fetchProducts}>
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ListHeaderComponent={
          <>
            <Banner backgroundImage={require('../../assets/banner-bg.jpg')} />
            <Breadcrumb />
            
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search products..."
                value={state.searchQuery}
                onChangeText={text => setState(prev => ({ ...prev, searchQuery: text }))}
                returnKeyType="search"
              />
              {state.searchQuery ? (
                <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              ) : null}
            </View>

            {state.searchQuery.trim() && (
              <View style={styles.resultsInfo}>
                <Text style={styles.resultsText}>
                  Found {filteredProducts.length} result{filteredProducts.length !== 1 ? 's' : ''} for "{state.searchQuery}"
                </Text>
                {!filteredProducts.length && (
                  <TouchableOpacity onPress={clearSearch} style={styles.showAllButton}>
                    <Text style={styles.showAllText}>Show all products</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <FilterBar />
          </>
        }
        data={state.searchQuery ? filteredProducts : products}
        numColumns={2}
        renderItem={({ item }) => <ProductCard product={item} navigation={navigation} />}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={state.refreshing} onRefresh={handleRefresh} />}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={50} color="#ccc" />
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        }
      />
      
      <FilterModal 
        visible={state.filterModalVisible}
        onClose={() => setState(prev => ({ ...prev, filterModalVisible: false }))}
        onApplyFilters={handleApplyFilters}
        currentFilters={state.filters}
        categories={categories}
      />
      
      <Toast />
    </View>
  );
};

// Update your styles to ensure proper spacing
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    paddingBottom: 20,
  },
  breadcrumbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  breadcrumbText: {
    fontSize: 12,
    color: '#666',
  },
  currentPage: {
    color: '#000',
    fontWeight: 'bold',
  },
  chevron: {
    marginHorizontal: 8,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 20,
  },
  filterButtonText: {
    fontSize: 14,
    marginLeft: 4,
    color: '#4CAF50',
  },
  filterBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  resultCount: {
    fontSize: 12,
    color: '#666',
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 20,
    paddingTop: 10,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#000',
    padding: 10,
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  // Search styles
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
  emptyContainer: {
    flex: 1,
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

export default Product;