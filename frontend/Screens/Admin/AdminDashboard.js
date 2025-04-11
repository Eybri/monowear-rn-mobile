import React, { useState, useEffect } from 'react';
import { 
  View, 
  ScrollView, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  Image,
  Dimensions 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import baseURL from "../../assets/common/baseurl";
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get token from AsyncStorage
      const token = await AsyncStorage.getItem('jwt');
      
      // Fetch users
      const userResponse = await fetch(`${baseURL}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const userData = await userResponse.json();
      
      // Fetch orders
      const orderResponse = await fetch(`${baseURL}/admin/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const orderData = await orderResponse.json();
      
      // Fetch sales stats
      const statsResponse = await fetch(`${baseURL}/admin/orders/delivered-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const statsData = await statsResponse.json();
      
      // Update state with fetched data
      setUsers(userData.users || []);
      setOrders(orderData.orders || []);
      setSalesData(statsData.salesData || []);
      
      // Calculate statistics
      const pendingOrders = orderData.orders.filter(order => order.status === 'Pending').length;
      const shippedOrders = orderData.orders.filter(order => order.status === 'Shipped').length;
      const deliveredOrders = orderData.orders.filter(order => order.status === 'Delivered').length;
      const cancelledOrders = orderData.orders.filter(order => order.status === 'Cancelled').length;
      const totalRevenue = orderData.orders
        .filter(order => order.status === 'Delivered')
        .reduce((sum, order) => sum + order.totalPrice, 0);
      
      setStats({
        totalUsers: userData.users.length,
        totalOrders: orderData.orders.length,
        pendingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        totalRevenue
      });
      
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Format data for charts
  const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    color: (opacity = 1) => `rgba(142, 68, 173, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`,
    strokeWidth: 2,
    decimalPlaces: 0,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#8e44ad"
    }
  };

  // Sales data for line chart
  const salesChartData = {
    labels: salesData.length > 0 ? salesData.map(item => item.date.substring(5)) : ['No data'],
    datasets: [
      {
        data: salesData.length > 0 ? salesData.map(item => item.totalSales) : [0],
        color: (opacity = 1) => `rgba(142, 68, 173, ${opacity})`,
        strokeWidth: 2
      }
    ],
    legend: ["Monthly Sales"]
  };

  // Order status data for pie chart
  const orderStatusData = [
    {
      name: "Pending",
      population: stats.pendingOrders,
      color: "#f1c40f",
      legendFontColor: "#7F7F7F",
      legendFontSize: 12
    },
    {
      name: "Shipped",
      population: stats.shippedOrders,
      color: "#3498db",
      legendFontColor: "#7F7F7F",
      legendFontSize: 12
    },
    {
      name: "Delivered",
      population: stats.deliveredOrders,
      color: "#2ecc71",
      legendFontColor: "#7F7F7F",
      legendFontSize: 12
    },
    {
      name: "Cancelled",
      population: stats.cancelledOrders,
      color: "#e74c3c",
      legendFontColor: "#7F7F7F",
      legendFontSize: 12
    }
  ];

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch(status) {
      case 'Delivered':
        return '#2ecc71';
      case 'Shipped':
        return '#3498db';
      case 'Pending':
        return '#f1c40f';
      case 'Cancelled':
        return '#e74c3c';
      default:
        return '#95a5a6';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8e44ad" />
        <Text style={styles.loadingText}>Loading dashboard data...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Text style={styles.headerSubtitle}>Overview of your business</Text>
      </View>

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <FontAwesome5 name="users" size={24} color="#8e44ad" />
          <Text style={styles.statNumber}>{stats.totalUsers}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>

        <View style={styles.statCard}>
          <FontAwesome5 name="box" size={24} color="#3498db" />
          <Text style={styles.statNumber}>{stats.totalOrders}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </View>

        <View style={styles.statCard}>
          <FontAwesome5 name="dollar-sign" size={24} color="#2ecc71" />
          <Text style={styles.statNumber}>₱{stats.totalRevenue.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>

        <View style={styles.statCard}>
          <FontAwesome5 name="clock" size={24} color="#e74c3c" />
          <Text style={styles.statNumber}>{stats.pendingOrders}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {/* Sales Chart */}
      <View style={styles.cardContainer}>
        <Text style={styles.cardTitle}>Monthly Sales</Text>
        {salesData.length > 0 ? (
          <LineChart
            data={salesChartData}
            width={width - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        ) : (
          <Text style={styles.noDataText}>No sales data available</Text>
        )}
      </View>

      {/* Order Status Chart */}
      <View style={styles.cardContainer}>
        <Text style={styles.cardTitle}>Order Status Breakdown</Text>
        {stats.totalOrders > 0 ? (
          <PieChart
            data={orderStatusData}
            width={width - 40}
            height={220}
            chartConfig={chartConfig}
            accessor={"population"}
            backgroundColor={"transparent"}
            paddingLeft={"15"}
            center={[10, 0]}
            absolute
          />
        ) : (
          <Text style={styles.noDataText}>No order data available</Text>
        )}
      </View>

      {/* Recent Orders */}
      <View style={styles.cardContainer}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Recent Orders</Text>
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="chevron-forward" size={16} color="#8e44ad" />
          </TouchableOpacity>
        </View>
        
        {orders.slice(0, 5).map((order, index) => (
          <View key={index} style={styles.orderItem}>
            <View style={styles.orderLeft}>
              <Text style={styles.orderLabel}>Order #{order._id.slice(-6)}</Text>
              <Text style={styles.orderCustomer}>{order.userId?.name || 'User'}</Text>
              <Text style={styles.orderDate}>
                <FontAwesome5 name="calendar-alt" size={10} color="#666" />
                {' '}
                {new Date(order.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.orderRight}>
              <Text style={styles.orderPrice}>₱{order.totalPrice.toLocaleString()}</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: `${getStatusColor(order.status)}30` }
              ]}>
                <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                  {order.status}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Recent Users */}
      <View style={styles.cardContainer}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Recent Users</Text>
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="chevron-forward" size={16} color="#8e44ad" />
          </TouchableOpacity>
        </View>
        
        {users.slice(0, 5).map((user, index) => (
          <View key={index} style={styles.userItem}>
            <View style={styles.userAvatar}>
              {user.avatar?.url ? (
                <Image 
                  source={{ uri: user.avatar.url }} 
                  style={styles.avatarImage} 
                  defaultSource={require('../../assets/splash-icon.png')}
                />
              ) : (
                <Text style={styles.avatarPlaceholder}>{user.name.charAt(0)}</Text>
              )}
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <Text style={styles.userRole}>{user.role}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 500,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8e44ad',
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 16,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 8,
    color: '#2c3e50',
  },
  statLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  cardContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2c3e50',
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  noDataText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginVertical: 40,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#8e44ad',
    marginRight: 4,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  orderLeft: {
    flex: 1,
  },
  orderLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  orderCustomer: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  orderDate: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderRight: {
    alignItems: 'flex-end',
  },
  orderPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8e44ad',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  userEmail: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  userRole: {
    fontSize: 12,
    color: '#8e44ad',
    fontWeight: 'bold',
    marginTop: 2,
  }
});

export default AdminDashboard;