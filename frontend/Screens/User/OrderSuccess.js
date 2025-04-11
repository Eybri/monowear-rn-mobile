import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const OrderSuccess = ({ route, navigation }) => {
  const { orderId } = route.params || {};
  const { width } = Dimensions.get('window');



  const viewOrder = () => {
    navigation.navigate('OrderHistory', { orderId: orderId });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#f8fff8', '#e8f5e9']}
        style={styles.background}
      />
      
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={72} color="#2d6a4f" />
        </View>
        
        <Text style={styles.title}>Order Confirmed</Text>
        <Text style={styles.subtitle}>Thank you for your purchase</Text>
        
        <View style={styles.divider} />
        
        <Text style={styles.message}>
          Your order has been received and is being processed.
        </Text>
        
        <View style={styles.orderInfoBox}>
          <Text style={styles.orderIdLabel}>ORDER NUMBER</Text>
          <Text style={styles.orderId}>{orderId || 'N/A'}</Text>
        </View>
        
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={styles.viewOrderButton}
            onPress={viewOrder}
          >
            <Text style={styles.viewOrderButtonText}>View Order Details</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.homeButton}
            onPress={() => navigation.navigate('Products')}
          >
            <Text style={styles.homeButtonText}>Continue Shopping</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" style={styles.buttonIcon} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fff8',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#2d6a4f',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#e8f5e9',
    borderRadius: 50,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a3e23',
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#5a8c6e',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  message: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  divider: {
    height: 1,
    width: '40%',
    backgroundColor: '#e0e0e0',
    marginVertical: 20,
  },
  orderInfoBox: {
    backgroundColor: '#f8fff8',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e0f0e5',
  },
  orderIdLabel: {
    fontSize: 12,
    color: '#5a8c6e',
    marginBottom: 6,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a3e23',
    letterSpacing: 0.5,
  },
  buttonsContainer: {
    width: '100%',
  },
  viewOrderButton: {
    backgroundColor: '#e8f5e9',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#d0e5d6',
  },
  viewOrderButtonText: {
    color: '#2d6a4f',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  homeButton: {
    backgroundColor: '#2d6a4f',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  buttonIcon: {
    marginLeft: 8,
  },
});

export default OrderSuccess;