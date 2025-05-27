import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

const FrontPage2 = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/logo.png')}
        style={styles.logo}
      />
      
      <Text style={styles.subtitle}>Mobile Application for Classifying Onion Pests</Text>
      <Text style={styles.subTitle}>Press the button to begin scanning.</Text>
      
      <TouchableOpacity
        style={styles.startButton}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.startButtonText}>Start</Text>
      </TouchableOpacity>
    </View>
  );
};

export default FrontPage2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 300,
    height: 300,
    resizeMode: 'contain',
    marginBottom: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A0D67',
  },
  subtitle: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginVertical: 10,
    marginTop: 20,
  },
  startButton: {
    backgroundColor: '#FF3BBF',
    padding: 15,
    width: 350,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  subTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 15,
    marginBottom: 1,
    textAlign: 'center',
  },
});
