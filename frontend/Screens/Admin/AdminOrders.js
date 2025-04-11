import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, TextInput, ActivityIndicator } from 'react-native';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { Card } from 'react-native-elements';
import Toast from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import baseURL from "../../assets/common/baseurl";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Local Colors definition
const Colors = {
  primary: '#8e44ad',
  secondary: '#9b59b6', 
  success: '#2ecc71',
  danger: '#e74c3c',
  warning: '#f39c12',
  info: '#3498db',
  light: '#f8f9fa',
  dark: '#343a40',
  white: '#ffffff',
  muted: '#6c757d',
  backgroundLight: '#f5f5f5',
  border: '#e1e1e1',
  textDark: '#2c3e50',
  textMuted: '#6c757d',
  textLight: '#95a5a6',
  shadow: 'rgba(0,0,0,0.1)',
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [cancellationNote, setCancellationNote] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filterDates, setFilterDates] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date()
  });
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    if (orders) {
      applyFilters();
    }
  }, [orders, filterStatus, filterDates]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem("jwt");
      const response = await fetch(`${baseURL}/admin/orders`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();
      setOrders(data.orders);
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError(err.message);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load orders',
        position: 'bottom'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadOrders();
    setIsRefreshing(false);
  };

  const applyFilters = () => {
    if (!orders) return;
    
    let filtered = [...orders];
    
    // Filter by date range
    filtered = filtered.filter(order => {
      const orderDate = moment(order.createdAt).toDate();
      return orderDate >= filterDates.start && orderDate <= filterDates.end;
    });
    
    // Filter by status
    if (filterStatus !== 'All') {
      filtered = filtered.filter(order => order.status === filterStatus);
    }
    
    setFilteredOrders(filtered);
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;
    
    try {
      setLoading(true);
      
      const token = await AsyncStorage.getItem("jwt");
      const updateData = {
        status: selectedStatus
      };
      
      if (selectedStatus === 'Cancelled') {
        if (!cancellationNote.trim()) {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Cancellation note is required',
            position: 'bottom'
          });
          return;
        }
        updateData.note = cancellationNote;
      }
      
      const response = await fetch(`${baseURL}/admin/orders/update`, {
        method: "PUT",
        body: JSON.stringify({ 
          orderId: selectedOrder._id,
          ...updateData 
        }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error("Failed to update order");
      }

      const data = await response.json();
      
      // Update local state
      setOrders(orders.map(order => 
        order._id === selectedOrder._id ? data.order : order
      ));
      
      setUpdateModalVisible(false);
      setCancellationNote('');
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Order updated successfully',
        position: 'bottom'
      });
    } catch (err) {
      console.error('Failed to update order:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update order',
        position: 'bottom'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      setLoading(true);
      
      const token = await AsyncStorage.getItem("jwt");
      const response = await fetch(`${baseURL}/admin/orders/delete`, {
        method: "DELETE",
        body: JSON.stringify({ orderId }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete order");
      }

      // Update local state
      setOrders(orders.filter(order => order._id !== orderId));
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Order deleted successfully',
        position: 'bottom'
      });
    } catch (err) {
      console.error('Failed to delete order:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete order',
        position: 'bottom'
      });
    } finally {
      setLoading(false);
    }
  };

  const openUpdateModal = (order) => {
    setSelectedOrder(order);
    setSelectedStatus(order.status);
    setUpdateModalVisible(true);
  };

  const toggleOrderExpand = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const handleDateChange = (event, selectedDate, dateType) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFilterDates(prev => ({
        ...prev,
        [dateType]: selectedDate
      }));
    }
  };

  const renderOrderStatus = (status) => {
    let color;
    let icon;
    
    switch (status) {
      case 'Pending':
        color = Colors.warning;
        icon = 'clock-o';
        break;
      case 'Shipped':
        color = Colors.info;
        icon = 'truck';
        break;
      case 'Delivered':
        color = Colors.success;
        icon = 'check-circle';
        break;
      case 'Cancelled':
        color = Colors.danger;
        icon = 'times-circle';
        break;
      default:
        color = Colors.dark;
        icon = 'question-circle';
    }
    
    return (
      <View style={[styles.statusBadge, { backgroundColor: color }]}>
        <FontAwesome name={icon} size={14} color="white" style={styles.statusIcon} />
        <Text style={styles.statusText}>{status}</Text>
      </View>
    );
  };

  const renderOrderItem = ({ item }) => {
    const isExpanded = expandedOrderId === item._id;
    const orderDate = moment(item.createdAt).format('MMM D, YYYY [at] h:mm A');
    
    return (
      <Card containerStyle={styles.orderCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderId}>Order #{item._id.slice(-8)}</Text>
            <Text style={styles.orderDate}>{orderDate}</Text>
          </View>
          {renderOrderStatus(item.status)}
        </View>
        
        <View style={styles.customerInfo}>
          <FontAwesome name="user" size={16} color={Colors.primary} />
          <Text style={styles.customerName}>{item.userId?.name || 'Unknown'}</Text>
          <Text style={styles.customerEmail}>{item.userId?.email || 'N/A'}</Text>
        </View>
        
        <View style={styles.orderSummary}>
          <Text style={styles.orderTotal}>₱{item.totalPrice.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</Text>
          <Text style={styles.itemCount}>{item.products.length} {item.products.length === 1 ? 'item' : 'items'}</Text>
        </View>
        
        <TouchableOpacity onPress={() => toggleOrderExpand(item._id)} style={styles.expandButton}>
          <Text style={styles.expandButtonText}>{isExpanded ? 'Hide Details' : 'View Details'}</Text>
          <MaterialIcons 
            name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} 
            size={22} 
            color={Colors.primary} 
          />
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.expandedContent}>
            <Text style={styles.sectionTitle}>Items</Text>
            {item.products.map((product, index) => (
              <View key={index} style={styles.productItem}>
                <Text style={styles.productName}>{product.productId?.name || 'Unknown Product'}</Text>
                <View style={styles.productDetails}>
                  <View style={[styles.colorIndicator, { backgroundColor: product.color || '#ddd' }]} />
                  <Text style={styles.productQty}>{product.quantity}x</Text>
                  <Text style={styles.productPrice}>₱{product.price.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</Text>
                </View>
              </View>
            ))}
            
            <Text style={styles.sectionTitle}>Shipping Address</Text>
            <Text style={styles.addressText}>
              {item.shippingAddress?.address}, {item.shippingAddress?.city}, {item.shippingAddress?.postalCode}, {item.shippingAddress?.country}
            </Text>
            
            <Text style={styles.sectionTitle}>Payment</Text>
            <Text style={styles.paymentMethod}>
              {item.paymentMethod === 'cashondelivery' ? 'Cash on Delivery' : 'Credit Card'}
            </Text>
            
            {item.status === 'Cancelled' && item.note && (
              <>
                <Text style={[styles.sectionTitle, { color: Colors.danger }]}>Cancellation Note</Text>
                <Text style={styles.cancellationNote}>{item.note}</Text>
              </>
            )}
            
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.updateButton]} 
                onPress={() => openUpdateModal(item)}
              >
                <MaterialIcons name="edit" size={18} color="white" />
                <Text style={styles.buttonText}>Update</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDeleteOrder(item._id)}
              >
                <MaterialIcons name="delete" size={18} color="white" />
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Card>
    );
  };

  const renderFilterSection = () => (
    <View style={styles.filterContainer}>
      <Text style={styles.filterTitle}>Filter Orders</Text>
      
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Status:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={filterStatus}
            style={styles.picker}
            onValueChange={(value) => setFilterStatus(value)}
          >
            <Picker.Item label="All Orders" value="All" />
            <Picker.Item label="Pending" value="Pending" />
            <Picker.Item label="Shipped" value="Shipped" />
            <Picker.Item label="Delivered" value="Delivered" />
            <Picker.Item label="Cancelled" value="Cancelled" />
          </Picker>
        </View>
      </View>
      
      <View style={styles.dateFilterRow}>
        <View style={styles.dateFilterItem}>
          <Text style={styles.filterLabel}>From:</Text>
          <TouchableOpacity 
            style={styles.datePickerButton}
            onPress={() => setShowDatePicker('start')}
          >
            <Text style={styles.dateText}>{moment(filterDates.start).format('MMM D, YYYY')}</Text>
            <MaterialIcons name="calendar-today" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.dateFilterItem}>
          <Text style={styles.filterLabel}>To:</Text>
          <TouchableOpacity 
            style={styles.datePickerButton}
            onPress={() => setShowDatePicker('end')}
          >
            <Text style={styles.dateText}>{moment(filterDates.end).format('MMM D, YYYY')}</Text>
            <MaterialIcons name="calendar-today" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
      
      {showDatePicker && (
        <DateTimePicker
          value={filterDates[showDatePicker]}
          mode="date"
          display="default"
          onChange={(event, date) => handleDateChange(event, date, showDatePicker)}
        />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>✦ Order Management ✦</Text>
      
      {renderFilterSection()}
      
      {loading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={36} color={Colors.danger} />
          <Text style={styles.errorText}>Failed to load orders</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadOrders}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="inbox" size={48} color={Colors.muted} />
          <Text style={styles.emptyText}>No orders found</Text>
          <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item._id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContainer}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      )}
      
      <Modal
        visible={updateModalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Order Status</Text>
              <TouchableOpacity onPress={() => setUpdateModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={Colors.dark} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalLabel}>Order ID: {selectedOrder?._id?.slice(-8)}</Text>
            
            <Text style={styles.modalLabel}>Status:</Text>
            <View style={styles.statusPickerContainer}>
              <Picker
                selectedValue={selectedStatus}
                style={styles.statusPicker}
                onValueChange={(value) => setSelectedStatus(value)}
              >
                <Picker.Item label="Pending" value="Pending" />
                <Picker.Item label="Shipped" value="Shipped" />
                <Picker.Item label="Delivered" value="Delivered" />
                <Picker.Item label="Cancelled" value="Cancelled" />
              </Picker>
            </View>
            
            {selectedStatus === 'Cancelled' && (
              <View style={styles.noteContainer}>
                <Text style={styles.modalLabel}>Cancellation Note (Required):</Text>
                <TextInput
                  style={styles.noteInput}
                  multiline={true}
                  numberOfLines={3}
                  placeholder="Enter reason for cancellation"
                  value={cancellationNote}
                  onChangeText={setCancellationNote}
                />
              </View>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setUpdateModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={handleUpdateOrder}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
    padding: 10,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    marginVertical: 16,
    letterSpacing: 1,
  },
  listContainer: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.textDark,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.danger,
    fontWeight: 'bold',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    color: Colors.textDark,
    fontWeight: 'bold',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.textMuted,
  },
  filterContainer: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterLabel: {
    width: 60,
    fontSize: 14,
    color: Colors.textDark,
  },
  pickerContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    height: 40,
    overflow: 'hidden',
  },
  picker: {
    height: 40,
    width: '100%',
  },
  dateFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateFilterItem: {
    width: '48%',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 10,
  },
  dateText: {
    fontSize: 14,
    color: Colors.textDark,
  },
  orderCard: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 0,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textDark,
  },
  orderDate: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusIcon: {
    marginRight: 5,
  },
  statusText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerName: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
    color: Colors.textDark,
  },
  customerEmail: {
    fontSize: 12,
    marginLeft: 8,
    color: Colors.textMuted,
  },
  orderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  itemCount: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  expandButtonText: {
    fontSize: 14,
    color: Colors.primary,
    marginRight: 5,
  },
  expandedContent: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textDark,
    marginBottom: 8,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  productName: {
    flex: 1,
    fontSize: 14,
    color: Colors.textDark,
  },
  productDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  productQty: {
    fontSize: 14,
    color: Colors.textDark,
    marginRight: 8,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textDark,
  },
  addressText: {
    fontSize: 14,
    color: Colors.textDark,
    marginBottom: 12,
  },
  paymentMethod: {
    fontSize: 14,
    color: Colors.textDark,
    marginBottom: 12,
  },
  cancellationNote: {
    fontSize: 14,
    color: Colors.danger,
    fontStyle: 'italic',
    marginBottom: 12,
    padding: 10,
    backgroundColor:  'rgba(231,76,60,0.1)',
    borderRadius: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    flex: 0.48,
  },
  updateButton: {
    backgroundColor: Colors.info,
  },
  deleteButton: {
    backgroundColor: Colors.danger,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 20,
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
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  modalLabel: {
    fontSize: 16,
    color: Colors.textDark,
    marginBottom: 8,
  },
  statusPickerContainer: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    marginBottom: 15,
    overflow: 'hidden',
  },
  statusPicker: {
    height: 50,
    width: '100%',
  },
  noteContainer: {
    marginBottom: 15,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 10,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 0.48,
  },
  cancelButton: {
    backgroundColor: Colors.light,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  cancelButtonText: {
    color: Colors.textDark,
    fontWeight: '500',
  },
  saveButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
});

export default AdminOrders;