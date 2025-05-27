import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase.js'; // <- Make sure the path is correct

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

const handleLogin = async () => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    navigation.navigate('Dashboard');
  } catch (error) {

    let message;
    switch (error.code) {
      case 'auth/user-not-found':
        message = 'User not found.';
        break;
      case 'auth/wrong-password':
        message = 'Incorrect password.';
        break;
      case 'auth/invalid-email':
        message = 'Invalid email address.';
        break;
      case 'auth/invalid-credential':
        message = 'Invalid email or password.';
        break;
      default:
        message = `Login failed: ${error.code}`;
        break;
    }

    Alert.alert('Login Error', message);
  }
};

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/logo.png')}
        style={styles.logo}
      />
      <Text style={styles.title}>LOGIN</Text>
      <Text style={styles.subTitle}>Enter your email and password if you already have an account.</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#FFF"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#FFF"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('ForgotPassword')}>
        <Text style={styles.linkText}>Forgot Password?</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: '#4A0D67',
    textAlign: 'center', 
  },
  input: {
    width: '100%',
    padding: 15,
    backgroundColor: '#4B6600',
    borderRadius: 10,
    marginBottom: 15,
    color: '#FFFFFF',
  },
  button: {
    backgroundColor: '#FF3BBF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 5,
    alignItems: 'center',
  },
  linkText: {
    color: '#4A0D67',
    fontWeight: '500',
  },
  subTitle: {
    fontSize: 12.3,
    color: '#6B7280',
    marginBottom: 17,
    textAlign: 'center',
  },
});
