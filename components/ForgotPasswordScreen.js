import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import app from '../firebase.js';
import AwesomeAlert from 'react-native-awesome-alerts';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const auth = getAuth(app);

  const [showAlert, setShowAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [onConfirmAction, setOnConfirmAction] = useState(null);

  const showCustomAlert = (title, message, onConfirm = null) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setOnConfirmAction(() => onConfirm);
    setShowAlert(true);
  };

  const handlePasswordReset = () => {
    if (!email) {
      showCustomAlert('Error', 'Please enter your email address');
      return;
    }

    sendPasswordResetEmail(auth, email)
      .then(() => {
        showCustomAlert(
          'Success',
          'Password reset email sent! Please check your inbox.',
          () => {
            setShowAlert(false);
            navigation.navigate('FrontPage');
          }
        );
      })
      .catch((error) => {
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
        showCustomAlert('Error', message);
      });
  };

  return (
    <View style={styles.container}>
      <Image source={require('../assets/logo.png')} style={styles.logo} />

      <Text style={styles.title}>FORGOT PASSWORD</Text>
      <Text style={styles.subTitle}>Enter your email to reset your password</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#FFF"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TouchableOpacity style={styles.button} onPress={handlePasswordReset}>
        <Text style={styles.buttonText}>Send</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('FrontPage')} style={styles.link}>
        <Text style={styles.linkText}>Back to Front Page</Text>
      </TouchableOpacity>

      <AwesomeAlert
        show={showAlert}
        title={alertTitle}
        message={alertMessage}
        closeOnTouchOutside={true}
        closeOnHardwareBackPress={true}
        showConfirmButton={true}
        confirmText="OK"
        confirmButtonColor="#7a1f6f"
        onConfirmPressed={() => {
          setShowAlert(false);
          if (onConfirmAction) onConfirmAction();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffffff',
    padding: 20,
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A0D67',
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
    width: '100%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
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
