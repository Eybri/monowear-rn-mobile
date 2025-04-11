import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ScrollView,

} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
const FilterModal = ({ visible, onClose, onApplyFilters, currentFilters, categories }) => {
  // Initialize state with current filters or defaults
  const [selectedCategory, setSelectedCategory] = useState(currentFilters.category || '');
  const [priceRange, setPriceRange] = useState({
    min: currentFilters.price?.gte || 0,
    max: currentFilters.price?.lte || 10000
  });

  // Reset filters when modal opens with current filters
  useEffect(() => {
    if (visible) {
      setSelectedCategory(currentFilters.category || '');
      setPriceRange({
        min: currentFilters.price?.gte || 0,
        max: currentFilters.price?.lte || 10000
      });
    }
  }, [visible, currentFilters]);

  const handleApplyFilters = () => {
    const filters = {};
    
    // Add category filter if selected
    if (selectedCategory) {
      filters.category = selectedCategory;
    }
    
    // Add price range if modified
    if (priceRange.min > 0 || priceRange.max < 10000) {
      filters.price = {};
      if (priceRange.min > 0) filters.price.gte = priceRange.min;
      if (priceRange.max < 10000) filters.price.lte = priceRange.max;
    }
    
    onApplyFilters(filters);
    onClose();
  };

  const handleClearFilters = () => {
    setSelectedCategory('');
    setPriceRange({ min: 0, max: 10000 });
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Products</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            {/* Category Filter */}
            {categories.length > 0 && (
              <View style={styles.filterSection}>
                <Text style={styles.sectionTitle}>Categories</Text>
                <View style={styles.categoryGrid}>
                  <TouchableOpacity
                    style={[
                      styles.categoryItem,
                      !selectedCategory && styles.selectedCategory
                    ]}
                    onPress={() => setSelectedCategory('')}
                  >
                    <Text style={!selectedCategory ? styles.selectedCategoryText : styles.categoryText}>
                      All
                    </Text>
                  </TouchableOpacity>
                  
                  {categories.map(category => (
                    <TouchableOpacity
                      key={category._id}
                      style={[
                        styles.categoryItem,
                        selectedCategory === category._id && styles.selectedCategory
                      ]}
                      onPress={() => setSelectedCategory(category._id)}
                    >
                      <Text style={selectedCategory === category._id ? styles.selectedCategoryText : styles.categoryText}>
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            
            {/* Price Range Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Price Range</Text>
              <View style={styles.priceRangeContainer}>
                <Text style={styles.priceValue}>₱{priceRange.min.toFixed(0)}</Text>
                <Text style={styles.priceSeparator}>-</Text>
                <Text style={styles.priceValue}>₱{priceRange.max.toFixed(0)}</Text>
              </View>
              
              <View style={styles.sliderContainer}>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={10000}
                  step={100}
                  value={priceRange.min}
                  onValueChange={(value) => setPriceRange({ ...priceRange, min: value })}
                  minimumTrackTintColor="#4CAF50"
                  maximumTrackTintColor="#DDDDDD"
                  thumbTintColor="#4CAF50"
                />
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={10000}
                  step={100}
                  value={priceRange.max}
                  onValueChange={(value) => setPriceRange({ ...priceRange, max: value })}
                  minimumTrackTintColor="#DDDDDD"
                  maximumTrackTintColor="#4CAF50"
                  thumbTintColor="#4CAF50"
                />
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={handleClearFilters}
            >
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.applyButton}
              onPress={handleApplyFilters}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  categoryItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    margin: 4,
  },
  selectedCategory: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  categoryText: {
    fontSize: 14,
  },
  selectedCategoryText: {
    color: '#fff',
    fontSize: 14,
  },
  priceRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  priceSeparator: {
    marginHorizontal: 12,
    fontSize: 16,
  },
  sliderContainer: {
    marginHorizontal: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  clearButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  applyButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#4CAF50',
    borderRadius: 6,
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

export default FilterModal;