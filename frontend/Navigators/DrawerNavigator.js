import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import HomeScreen from '../Screens/User/Home';
import ProductDetail from '../Screens/User/ProductDetail';
import ProductScreen from '../Screens/User/Product';
import ProfileScreen from '../Screens/User/Profile';
import LoginScreen from '../Screens/Login';
import { logoutUser } from '../Redux/Actions/Auth.actions';
import CartIcon from '../Shared/CartIcon';
import RegisterScreen from '../Screens/Register';
import CartScreen from '../Screens/User/Cart';
import CheckoutScreen from '../Screens/User/CheckOut';
import OrderSuccess from '../Screens/User/OrderSuccess';
import Payment from '../Screens/User/Payment';
import OrderHistory from '../Screens/User/OrderHistory'
import Reviews from '../Screens/User/Reviews'
const Drawer = createDrawerNavigator();

const CustomHeader = ({ navigation }) => {
  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity onPress={() => navigation.toggleDrawer()}>
        <Ionicons name="menu" size={24} color="black" />
      </TouchableOpacity>
      
      <View style={styles.logoContainer}>
        <Image
            source={require('../assets/Logo.png')} // adjust path based on your file structure
            style={styles.logoImage}
            resizeMode="contain"
        />
      </View>
      
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="search" size={22} color="black" />
        </TouchableOpacity>
        <CartIcon navigation={navigation} />
      </View>
    </View>
  );
};

const CustomDrawerContent = ({ navigation }) => {
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  
  const menuItems = [
    { name: 'HOME', screen: 'Home' },
    { name: 'SHOP', screen: 'Products' },
    { name: 'ORDER HISTORY', screen: 'OrderHistory' },
    { name: 'ORDER REVIEWS', screen: 'Reviews' }


  ];

  // Add admin dashboard item if user is admin
  if (isAuthenticated && user && user.role === 'admin') {
    menuItems.push({ name: 'ADMIN DASHBOARD', screen: 'AdminDashboard' });
  }
  
  const handleLogout = async () => {
    const success = await dispatch(logoutUser());
    if (success) {
        // Reset the navigation stack and navigate to Home
        navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }]
        });
    }
    navigation.closeDrawer();
  };

  return (
    <View style={styles.drawerContainer}>
      <View style={styles.drawerHeader}>
        <TouchableOpacity onPress={() => navigation.closeDrawer()}>
          <Ionicons name="close" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.drawerLogoText}>M O N O W E A R™</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <View style={styles.drawerContent}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.drawerItem}
            onPress={() => {
              navigation.navigate(item.screen);
              navigation.closeDrawer();
            }}
          >
            <Text style={[
              styles.drawerItemText,
              item.name === 'ADMIN DASHBOARD' && styles.adminText // Add special style for admin dashboard
            ]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {isAuthenticated && user ? (
        <View style={styles.userSection}>
          <TouchableOpacity 
            style={styles.userInfo}
            onPress={() => {
              navigation.navigate('Profile');
              navigation.closeDrawer();
            }}
          >
            <Ionicons name="person" size={18} color="black" />
            <Text style={styles.userName}>
              {user.name || 'User'}
              {user.role === 'admin' && ' (Admin)'} {/* Show admin badge */}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={18} color="black" />
            <Text style={styles.logoutText}>LOGOUT</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => {
            navigation.navigate('Login');
            navigation.closeDrawer();
          }}
        >
          <Ionicons name="person-outline" size={18} color="black" />
          <Text style={styles.loginText}>LOGIN</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
const DrawerNavigator = () => {
    return (
      <Drawer.Navigator
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={({ navigation }) => ({
          header: () => <CustomHeader navigation={navigation} />,
          drawerStyle: {
            width: '80%',
          },
          headerShown: true,
        })}
      >
        <Drawer.Screen name="Home" component={HomeScreen} />
        <Drawer.Screen name="ProductDetail" component={ProductDetail} />
        <Drawer.Screen name="OrderHistory" component={OrderHistory} />
        <Drawer.Screen name="Reviews" component={Reviews} />

      <Drawer.Screen 
        name="Products" 
        component={ProductScreen} 
        options={{
          drawerLabel: 'SHOP', 
        }}
      />
        <Drawer.Screen 
          name="Profile" 
          component={ProfileScreen}
          options={{ drawerItemStyle: { display: 'none' } }} // Hide from drawer menu
        />
        <Drawer.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ headerShown: false, drawerItemStyle: { display: 'none' } }}
        />
        <Drawer.Screen 
          name="OrderSuccess" 
          component={OrderSuccess}
          options={{ headerShown: false, drawerItemStyle: { display: 'none' } }}
        />
        <Drawer.Screen 
          name="Payment" 
          component={Payment}
          options={{ headerShown: true, drawerItemStyle: { display: 'none' } }}
        />
        <Drawer.Screen 
          name="Checkout" 
          component={CheckoutScreen}
          options={{ headerShown: true, drawerItemStyle: { display: 'none' } }}
        />
        <Drawer.Screen 
          name="Register" 
          component={RegisterScreen}
          options={{ headerShown: false, drawerItemStyle: { display: 'none' } }}
        />
        <Drawer.Screen 
          name="Cart" 
          component={CartScreen}
          options={{ headerShown: true, drawerItemStyle: { display: 'none' } }}
        />
      </Drawer.Navigator>
    );
  };

const styles = StyleSheet.create({
      logoContainer: {
    flexDirection: 'row', // or 'column' if you want image above the text
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: 180,   // 🔧 adjust size here
    height: 40,
    marginRight: 10, // space between image and text
  },
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
  logoText: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginRight: 16,
  },
  cartButton: {
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'black',
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  drawerContainer: {
    flex: 1,
    backgroundColor: 'white',
    marginTop : 15
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
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  drawerItemText: {
    fontSize: 14,
    letterSpacing: 0.5,
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
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  loginText: {
    marginLeft: 8,
    fontSize: 14,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#d9534f',
  },
});

export default DrawerNavigator;