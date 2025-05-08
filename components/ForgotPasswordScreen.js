import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');

  return (
    <View style={styles.container}>
      {/* Logo and Name */}
      <Image
        source={require('../assets/logo.png')}
        style={styles.logo}
      />

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
      <TouchableOpacity style={styles.button} onPress={() => alert('Password Reset Email Sent')}>
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
