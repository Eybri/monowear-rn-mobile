import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import baseURL from '../../assets/common/baseurl';
import Toast from 'react-native-toast-message';
import Loading from '../../Shared/Loading';

const AddressCard = ({ user, onUpdate }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);
  const [formData, setFormData] = useState({
    address: user?.shippingInfo?.address || '',
    city: user?.shippingInfo?.city || '',
    phoneNo: user?.shippingInfo?.phoneNo || '',
    postalCode: user?.shippingInfo?.postalCode || '',
    country: user?.shippingInfo?.country || ''
  });

  useEffect(() => {
    const getToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('jwt');
        setToken(storedToken);
      } catch (error) {
        console.error('Error getting token:', error);
      }
    };
    getToken();
  }, []);

  const handleChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async () => {
    if (!formData.address || !formData.city || !formData.phoneNo || !formData.postalCode || !formData.country) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill all fields',
        position: 'bottom'
      });
      return;
    }

    try {
      setLoading(true);
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };

      const response = await axios.put(`${baseURL}/me/shipping`, formData, config);
      
      if (response.data.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Shipping address updated successfully',
          position: 'bottom'
        });
        onUpdate();
        setModalVisible(false);
      } else {
        throw new Error(response.data.message || 'Failed to update shipping address');
      }
    } catch (error) {
      console.error('Shipping update error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || error.message || 'Failed to update shipping address',
        position: 'bottom'
      });
    } finally {
      setLoading(false);
    }
  };

  const hasShippingInfo = user?.shippingInfo?.address;

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Shipping Address</Text>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons 
              name={hasShippingInfo ? "create-outline" : "add-circle-outline"} 
              size={20} 
              color="#2E8B57" 
            />
            <Text style={styles.editButtonText}>
              {hasShippingInfo ? "Edit" : "Add Address"}
            </Text>
          </TouchableOpacity>
        </View>

        {hasShippingInfo ? (
          <View style={styles.addressContainer}>
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={16} color="#5E8B7E" />
              <Text style={styles.addressText}>{user.shippingInfo.address}</Text>
            </View>
            <View style={styles.addressRow}>
              <Ionicons name="business-outline" size={16} color="#5E8B7E" />
              <Text style={styles.addressText}>{user.shippingInfo.city}, {user.shippingInfo.postalCode}</Text>
            </View>
            <View style={styles.addressRow}>
              <Ionicons name="earth-outline" size={16} color="#5E8B7E" />
              <Text style={styles.addressText}>{user.shippingInfo.country}</Text>
            </View>
            <View style={styles.addressRow}>
              <Ionicons name="call-outline" size={16} color="#5E8B7E" />
              <Text style={styles.addressText}>{user.shippingInfo.phoneNo}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.noAddressContainer}>
            <Ionicons name="information-circle-outline" size={20} color="#5E8B7E" />
            <Text style={styles.noAddressText}>No shipping address added</Text>
          </View>
        )}
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Shipping Address</Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={22} color="#5E8B7E" />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Street Address</Text>
                <TextInput
                  style={styles.input}
                  value={formData.address}
                  onChangeText={(text) => handleChange('address', text)}
                  placeholder="123 Main St"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>City</Text>
                <TextInput
                  style={styles.input}
                  value={formData.city}
                  onChangeText={(text) => handleChange('city', text)}
                  placeholder="Your City"
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>Postal Code</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.postalCode}
                    onChangeText={(text) => handleChange('postalCode', text)}
                    placeholder="12345"
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Phone</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.phoneNo}
                    onChangeText={(text) => handleChange('phoneNo', text)}
                    placeholder="+1234567890"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Country</Text>
                <TextInput
                  style={styles.input}
                  value={formData.country}
                  onChangeText={(text) => handleChange('country', text)}
                  placeholder="Your Country"
                />
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.submitButton} 
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <Loading size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Save Address</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#5E8B7E',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2E8B57',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#E8F5E9',
  },
  editButtonText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#2E8B57',
    fontWeight: '500',
  },
  noAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  noAddressText: {
    marginLeft: 8,
    color: '#5E8B7E',
    fontSize: 13,
  },
  addressContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#555',
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E8B57',
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
    fontSize: 13,
    color: '#5E8B7E',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#FAFAFA',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    color: '#5E8B7E',
    fontWeight: '500',
    fontSize: 14,
  },
  submitButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#2E8B57',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
  },
});

export default AddressCard;