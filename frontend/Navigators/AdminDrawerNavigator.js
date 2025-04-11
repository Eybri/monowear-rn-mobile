// Navigators/AdminDrawerNavigator.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { logoutUser } from '../Redux/Actions/Auth.actions';
import AdminDashboard from '../Screens/Admin/AdminDashboard';
import AdminProducts from '../Screens/Admin/AdminProducts';
import AdminOrders from '../Screens/Admin/AdminOrders';
import AdminUsers from '../Screens/Admin/AdminUsers';

const Drawer = createDrawerNavigator();

const AdminHeader = ({ navigation }) => {
  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity onPress={() => navigation.toggleDrawer()}>
        <Ionicons name="menu" size={24} color="black" />
      </TouchableOpacity>
      
      <View style={styles.logoContainer}>
        <Text style={styles.headerTitle}>ADMIN PANEL</Text>
      </View>
      
      <View style={styles.headerRight}>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Ionicons name="home-outline" size={22} color="black" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const AdminDrawerContent = ({ navigation }) => {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  
  const menuItems = [
    { name: 'DASHBOARD', screen: 'AdminDashboard', icon: 'grid-outline' },
    { name: 'PRODUCTS', screen: 'AdminProducts', icon: 'shirt-outline' },
    { name: 'ORDERS', screen: 'AdminOrders', icon: 'receipt-outline' },
    { name: 'USERS', screen: 'AdminUsers', icon: 'people-outline' },
    { name: 'BACK TO SHOP', screen: 'App', icon: 'arrow-back-outline' } // Changed to 'App'
  ];

  const handleLogout = async () => {
    const success = await dispatch(logoutUser());
    if (success) {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'App' }], // Changed to 'App'
        })
      );
    }
    navigation.closeDrawer();
  };

  const handleNavigation = (screen) => {
    if (screen === 'App') {
      // For going back to user side
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'App' }],
        })
      );
    } else {
      // Normal navigation for admin screens
      navigation.navigate(screen);
    }
    navigation.closeDrawer();
  };

  return (
    <View style={styles.drawerContainer}>
      {/* ... (keep the rest of your drawer content JSX the same) */}
      
      <View style={styles.drawerContent}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.drawerItem}
            onPress={() => handleNavigation(item.screen)} // Use the new handler
          >
            <Ionicons name={item.icon} size={20} color="black" />
            <Text style={styles.drawerItemText}>
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.userSection}>
        <View style={styles.userInfo}>
          <Ionicons name="person-circle-outline" size={18} color="black" />
          <Text style={styles.userName}>
            {user?.name || 'Admin'}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={18} color="black" />
          <Text style={styles.logoutText}>LOGOUT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const AdminDrawerNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <AdminDrawerContent {...props} />}
      screenOptions={({ navigation }) => ({
        header: () => <AdminHeader navigation={navigation} />,
        drawerStyle: {
          width: '80%',
        },
        headerShown: true,
      })}
    >
      <Drawer.Screen name="AdminDashboard" component={AdminDashboard} />
      <Drawer.Screen name="AdminProducts" component={AdminProducts} />
      <Drawer.Screen name="AdminOrders" component={AdminOrders} />
      <Drawer.Screen name="AdminUsers" component={AdminUsers} />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: 'white',
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginRight: 16,
  },
  drawerContainer: {
    flex: 1,
    backgroundColor: 'white',
    marginTop: 15
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  drawerLogoText: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  drawerContent: {
    flex: 1,
    paddingTop: 8,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  drawerItemText: {
    fontSize: 14,
    letterSpacing: 0.5,
    marginLeft: 15,
  },
  userSection: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userName: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#d9534f',
  },
});

export default AdminDrawerNavigator;