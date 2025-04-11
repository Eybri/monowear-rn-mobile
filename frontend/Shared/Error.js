// Components/Error.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Error = ({ message }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.errorText}>{message || 'Something went wrong'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    color: '#F44336',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default Error;