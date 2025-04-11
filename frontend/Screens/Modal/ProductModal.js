import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import baseURL from '../../assets/common/baseurl';
import { Picker } from '@react-native-picker/picker';

const { width } = Dimensions.get('window');

// Predefined color options
const COLOR_OPTIONS = [
  { label: 'Red', value: 'Red' },
  { label: 'Blue', value: 'Blue' },
  { label: 'Green', value: 'Green' },
  { label: 'Black', value: 'Black' },
  { label: 'White', value: 'White' },
  { label: 'Yellow', value: 'Yellow' },
  { label: 'Purple', value: 'Purple' },
  { label: 'Orange', value: 'Orange' },
  { label: 'Pink', value: 'Pink' },
  { label: 'Gray', value: 'Gray' },
];

const ProductModal = ({ 
  visible, 
  onClose, 
  onSubmit,
  product = null, // Pass product for edit mode, null for create mode
  categories = []
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');
  const [selectedColors, setSelectedColors] = useState([]);
  const [currentColor, setCurrentColor] = useState('');
  const [images, setImages] = useState([]);
  const [imagesPreview, setImagesPreview] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [hasChangedImages, setHasChangedImages] = useState(false);
  
  // Initialize form with product data if in edit mode
  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setPrice(product.price ? product.price.toString() : '');
      setDescription(product.description || '');
      setCategory(product.category?._id || product.category || '');
      setStock(product.stock ? product.stock.toString() : '');
      
      // Handle colors array properly - fixed here
      if (product.colors && Array.isArray(product.colors)) {
        setSelectedColors(product.colors.map(color => 
          // Ensure first letter is capitalized to match the color options format
          color.charAt(0).toUpperCase() + color.slice(1).toLowerCase()
        ));
      } else {
        setSelectedColors([]);
      }
      
      // Store existing images separately
      if (product.images && product.images.length > 0) {
        setExistingImages(product.images);
        setImagesPreview(product.images.map(img => ({ uri: img.url })));
      } else {
        setExistingImages([]);
        setImagesPreview([]);
      }
      
      // Reset the flag when opening the modal
      setHasChangedImages(false);
      // Reset new images array
      setImages([]);
      
    } else {
      // Reset form for create mode
      resetForm();
    }
  }, [product, visible, categories]);  
  
  const resetForm = () => {
    setName('');
    setPrice('');
    setDescription('');
    setCategory('');
    setStock('');
    setSelectedColors([]);
    setCurrentColor('');
    setImages([]);
    setImagesPreview([]);
    setExistingImages([]);
    setHasChangedImages(false);
  };
  
  const addColor = () => {
    if (currentColor && !selectedColors.includes(currentColor)) {
      setSelectedColors([...selectedColors, currentColor]);
      setCurrentColor(''); // Reset current color after adding
    }
  };
  
  const removeColor = (colorToRemove) => {
    setSelectedColors(selectedColors.filter(color => color !== colorToRemove));
  };
  
  const pickImages = async () => {
    try {
      // Request permissions first
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'We need camera roll permissions to upload images');
          return;
        }
      }
      
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        allowsMultipleSelection: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Clear existing image previews and images when picking new ones in edit mode
        if (product) {
          setImagesPreview([]);
          setExistingImages([]);
          setHasChangedImages(true);
        }
        
        // Process selected images
        const newImages = [];
        const newPreviews = [];
        
        for (let asset of result.assets) {
          if (asset.base64) {
            newImages.push(`data:image/jpeg;base64,${asset.base64}`);
            newPreviews.push({ uri: asset.uri });
          }
        }
        
        setImages(newImages);
        setImagesPreview(newPreviews);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to select images');
    }
  };
  
  const removeImage = (index) => {
    // If we're removing an existing image in edit mode
    if (product && !hasChangedImages) {
      setHasChangedImages(true);
      
      // Create a new array without the removed image
      const newExistingImages = [...existingImages];
      newExistingImages.splice(index, 1);
      setExistingImages(newExistingImages);
      
      // If we've removed all existing images, we'll need new ones
      if (newExistingImages.length === 0) {
        setImages([]);
      }
    } else {
      // Removing newly selected image
      const newImages = [...images];
      newImages.splice(index, 1);
      setImages(newImages);
    }
    
    // Always update preview
    const newPreviews = [...imagesPreview];
    newPreviews.splice(index, 1);
    setImagesPreview(newPreviews);
  };
  
  const handleSubmit = async () => {
    // Form validation
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Product name is required');
      return;
    }
    
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid price');
      return;
    }
    
    if (!category) {
      Alert.alert('Validation Error', 'Please select a category');
      return;
    }
    
    if (selectedColors.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one color');
      return;
    }
    
    if (!stock || isNaN(parseInt(stock)) || parseInt(stock) < 0) {
      Alert.alert('Validation Error', 'Please enter a valid stock quantity');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const productData = {
        name,
        price: parseFloat(price),
        description,
        category,
        stock: parseInt(stock),
        colors: selectedColors // This will now be properly sent to the backend
      };
      
      // For create mode or when images have changed, include new images
      if (!product || hasChangedImages) {
        if (images.length > 0) {
          // New images were selected
          productData.images = images;
        } else if (product && existingImages.length > 0) {
          // Keep some of the original images
          productData.existingImages = existingImages;
        } else if (imagesPreview.length === 0 && product) {
          // All images were removed
          productData.clearImages = true;
        }
      }
      
      await onSubmit(productData, product?._id);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error submitting product:', error);
      Alert.alert('Error', error.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {product ? 'Edit Product' : 'Add New Product'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.formContainer}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Product Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter product name"
                placeholderTextColor="#999"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Price (₱) *</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                placeholder="0.00"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Product description"
                placeholderTextColor="#999"
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Category *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={category}
                  onValueChange={(itemValue) => {
                    setCategory(itemValue);
                  }}
                  style={styles.picker}
                >
                  <Picker.Item label="Select a category" value="" />
                  {Array.isArray(categories) && categories.length > 0 ? (
                    categories.map((cat) => {
                      // Make sure cat and cat.name exist before accessing
                      if (!cat || !cat.name) {
                        return null;
                      }
                      return (
                        <Picker.Item 
                          key={cat._id || String(Math.random())} 
                          label={cat.name} 
                          value={cat._id || ''} 
                        />
                      );
                    })
                  ) : (
                    <Picker.Item label="No categories available" value="" />
                  )}
                </Picker>
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Colors *</Text>
              <View style={styles.colorSelectionContainer}>
                <View style={styles.colorPickerRow}>
                  <View style={[styles.pickerContainer, { flex: 1 }]}>
                    <Picker
                      selectedValue={currentColor}
                      onValueChange={(itemValue) => setCurrentColor(itemValue)}
                      style={styles.picker}
                    >
                      <Picker.Item label="Select a color" value="" />
                      {COLOR_OPTIONS.map((colorOption) => (
                        <Picker.Item 
                          key={colorOption.value} 
                          label={colorOption.label} 
                          value={colorOption.value}
                        />
                      ))}
                    </Picker>
                  </View>
                  
                  {/* Show selected color preview */}
                  {currentColor ? (
                    <View 
                      style={{
                        width: 30,
                        height: 30,
                        backgroundColor: currentColor.toLowerCase(),
                        borderRadius: 15,
                        marginHorizontal: 8,
                        borderWidth: 1,
                        borderColor: '#ccc'
                      }}
                    />
                  ) : null}
                  
                  <TouchableOpacity 
                    style={[
                      styles.addColorButton,
                      !currentColor && { opacity: 0.5 }
                    ]} 
                    onPress={addColor}
                    disabled={!currentColor}
                  >
                    <Ionicons name="add" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
                
                {selectedColors.length > 0 && (
                  <View style={styles.selectedColorsContainer}>
                    {selectedColors.map((color, index) => (
                      <View key={index} style={styles.selectedColorChip}>
                        <View 
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            backgroundColor: color.toLowerCase(),
                            borderWidth: 1,
                            borderColor: '#e0e0e0',
                            marginRight: 8
                          }}
                        />
                        <Text style={styles.colorName}>
                          {color}
                        </Text>
                        <TouchableOpacity 
                          onPress={() => removeColor(color)}
                          style={styles.removeColorButton}
                        >
                          <Ionicons name="close-circle" size={18} color="#ff4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Stock *</Text>
              <TextInput
                style={styles.input}
                value={stock}
                onChangeText={setStock}
                placeholder="Available quantity"
                placeholderTextColor="#999"
                keyboardType="number-pad"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Product Images</Text>
              <TouchableOpacity style={styles.imagePickerButton} onPress={pickImages}>
                <Ionicons name="images-outline" size={22} color="#fff" />
                <Text style={styles.imagePickerText}>
                  {imagesPreview.length > 0 
                    ? 'Change Images' 
                    : 'Upload Images'}
                </Text>
              </TouchableOpacity>
              
              {imagesPreview.length > 0 && (
                <View style={styles.imagePreviewContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {imagesPreview.map((img, index) => (
                      <View key={index} style={styles.imagePreview}>
                        <Image 
                          source={{ uri: img.uri }} 
                          style={styles.previewImage} 
                        />
                        <TouchableOpacity
                          style={styles.removeImageButton}
                          onPress={() => removeImage(index)}
                        >
                          <Ionicons name="close-circle" size={24} color="#ff4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </ScrollView>
          
          <View style={styles.formActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.submitButton]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {product ? 'Update' : 'Create'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: width > 500 ? 500 : width - 30,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a3e23',
  },
  formContainer: {
    padding: 16,
    maxHeight: 500,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 100,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  colorSelectionContainer: {
    marginBottom: 8,
  },
  colorPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addColorButton: {
    backgroundColor: '#5a8c6e',
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  selectedColorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  selectedColorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  colorName: {
    fontSize: 14,
    color: '#333',
    marginRight: 4,
  },
  removeColorButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerButton: {
    backgroundColor: '#5a8c6e',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  imagePreviewContainer: {
    marginTop: 12,
  },
  imagePreview: {
    width: 80,
    height: 80,
    marginRight: 10,
    borderRadius: 6,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  removeImageButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#555',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#2d6a4f',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default ProductModal;