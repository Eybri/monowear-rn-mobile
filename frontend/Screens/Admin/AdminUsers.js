// Screens/Admin/Users.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AdminUsers = () => {
  return (
    <View style={styles.container}>
      <Text>Admin Users Management</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AdminUsers;