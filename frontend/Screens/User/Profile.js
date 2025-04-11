// Profile.js
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  Image,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { getUserProfile } from '../../Redux/Actions/Auth.actions';
import UpdateProfileModal from '../Modal/UpdateProfileModal';
import AddressCard from './AddressCard'; 

const Profile = ({ navigation }) => {
  const { user, loading } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchUserProfile = async () => {
    setRefreshing(true);
    await dispatch(getUserProfile());
    setRefreshing(false);
  };

  const handleProfileUpdate = () => {
    fetchUserProfile();
  };

  const handleShippingUpdate = () => {
    fetchUserProfile(); 
  };

  const avatarUrl = user?.avatar?.url || null;

  if (loading || refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={fetchUserProfile}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      {/* Personal Info Card */}
      <View style={styles.card}>
        <View style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image 
              source={{ uri: avatarUrl }} 
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={40} color="#fff" />
            </View>
          )}
        </View>

        <View style={styles.cardHeader}>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="pencil" size={18} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user?.email || 'No email provided'}</Text>
        </View>
      </View>

      <AddressCard 
        user={user} 
        onUpdate={handleShippingUpdate} 
      />
       
      {/* Footer Links */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerLink}>
          <Text style={styles.footerLinkText}>Shipping policy</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerLink}>
          <Text style={styles.footerLinkText}>Terms of service</Text>
        </TouchableOpacity>
      </View>

      {/* Update Profile Modal */}
      <UpdateProfileModal
        visible={modalVisible}
        user={user}
        onClose={() => setModalVisible(false)}
        onUpdate={handleProfileUpdate}
      />

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  editButton: {
    padding: 8,
  },
  infoSection: {
    marginVertical: 5,
  },
  infoLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#000',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#000',
  },
  noAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    padding: 20,
    borderRadius: 4,
  },
  noAddressText: {
    marginLeft: 10,
    color: '#777',
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  footerLink: {
    marginVertical: 5,
  },
  footerLinkText: {
    color: '#000',
    fontSize: 14,
  },
});

export default Profile;