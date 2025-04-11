import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import baseURL from "../assets/common/baseurl";

const SearchBar = ({ onSearchResults, onFocus }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const searchProductsDirectly = async (searchTerm) => {
    try {
      setIsSearching(true);
      const params = new URLSearchParams();
      params.append('keyword', searchTerm);
      
      const response = await fetch(`${baseURL}/products/search?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      if (!response.ok) {
        throw new Error("Search failed");
      }
  
      const data = await response.json();
      onSearchResults(data.products);
      return data.products;
    } catch (err) {
      console.error("Search error:", err);
      Toast.show({
        type: "error",
        text1: "Search Error",
        text2: err.message || "Failed to search products",
        position: "bottom"
      });
      onSearchResults([]);
      return [];
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      searchProductsDirectly(searchTerm);
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    onSearchResults(null); // Clear search results
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder="Search products..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          onSubmitEditing={handleSearch}
          onFocus={onFocus}
          returnKeyType="search"
        />
        {searchTerm ? (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>
      <TouchableOpacity 
        style={styles.searchButton} 
        onPress={handleSearch}
        disabled={isSearching}
      >
        {isSearching ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
  },
  clearButton: {
    marginLeft: 8,
  },
  searchButton: {
    marginLeft: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SearchBar;