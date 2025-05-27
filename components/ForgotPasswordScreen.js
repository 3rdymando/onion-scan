import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth'; // Import Firebase Auth functions
import app from '../firebase.js'; // Adjust the path to your firebase config file

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const auth = getAuth(app);

  const handlePasswordReset = () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    sendPasswordResetEmail(auth, email)
      .then(() => {
        Alert.alert(
          'Success',
          'Password reset email sent! Please check your inbox.',
          [{ text: 'OK', onPress: () => navigation.navigate('FrontPage') }]
        );
      })
      .catch((error) => {
        // Handle errors here
        let message = '';
        switch (error.code) {
          case 'auth/invalid-email':
            message = 'Invalid email address format.';
            break;
          case 'auth/user-not-found':
            message = 'No user found with this email.';
            break;
          default:
            message = error.message;
        }
        Alert.alert('Error', message);
      });
  };

  return (
    <View style={styles.container}>
      {/* Logo and Name */}
      <Image source={require('../assets/logo.png')} style={styles.logo} />

      {/* Title */}
      <Text style={styles.title}>FORGOT PASSWORD</Text>
      <Text style={styles.subTitle}>Enter your email to reset your password</Text>

      {/* Input Field */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#FFF"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* Send Button */}
      <TouchableOpacity style={styles.button} onPress={handlePasswordReset}>
        <Text style={styles.buttonText}>Send</Text>
      </TouchableOpacity>

      {/* Back Button */}
      <TouchableOpacity onPress={() => navigation.navigate('FrontPage')} style={styles.link}>
        <Text style={styles.linkText}>Back to Front Page</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // white background
    padding: 20,
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A0D67', // purple color
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A0D67', // purple color
    marginBottom: 10,
  },
  subTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    padding: 15,
    backgroundColor: '#4B6600', // green background
    borderRadius: 10,
    marginBottom: 15,
    color: '#FFFFFF', // white text
  },
  button: {
    backgroundColor: '#FF3BBF', // pink button
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#4A0D67',
    fontWeight: '500',
  },
});
