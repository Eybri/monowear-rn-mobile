import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const Banner = ({ 
  title = "PRODUCTS", 
  subtitle = "MONOWEAR P.O.", 
  backgroundImage = require('../assets/banner-bg.jpg') 
}) => {
  const navigation = useNavigation();

  return (
    <ImageBackground 
      source={backgroundImage}
      style={styles.bannerContainer}
      resizeMode="cover"
    >
      <View style={styles.overlay}>     
        <Text style={styles.subtitle}>{subtitle}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    width: '100%',
    height: Dimensions.get('window').height * 0.25, // 25% of screen height
    justifyContent: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)', // Semi-dark overlay
    padding: 20,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
  },
  backText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  subtitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '300',
    letterSpacing: 2,
    marginBottom: 5,
    textAlign: 'center',
  },
  title: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 3,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});

export default Banner;