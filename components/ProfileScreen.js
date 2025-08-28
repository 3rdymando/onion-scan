import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getAuth, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.js';
import AwesomeAlert from 'react-native-awesome-alerts';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Alert states
  const [showAlert, setShowAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [showCancelButton, setShowCancelButton] = useState(false);
  const [confirmText, setConfirmText] = useState('OK');
  const [onConfirmAction, setOnConfirmAction] = useState(null);

  const showCustomAlert = (
    title,
    message,
    options = { confirmText: 'OK', cancel: false, onConfirm: null }
  ) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setConfirmText(options.confirmText || 'OK');
    setShowCancelButton(!!options.cancel);
    setOnConfirmAction(() => options.onConfirm || (() => {}));
    setShowAlert(true);
  };

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      Alert.alert('Not logged in', 'Please login first');
      navigation.navigate('Login');
      return;
    }

    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setName(userData.name || '');
          setEmail(userData.email || '');
        } else {
          console.warn('User document does not exist');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [navigation]);

  const handleLogout = () => {
    showCustomAlert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      {
        confirmText: 'Logout',
        cancel: true,
        onConfirm: async () => {
          const auth = getAuth();
          try {
            await signOut(auth);
            navigation.navigate('FrontPage');
          } catch (error) {
            showCustomAlert('Logout failed', error.message);
          }
        }
      }
    );
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/logo.png')}
        style={styles.avatar}
      />
      <Text style={styles.name}>{name || 'No Name Set'}</Text>
      <Text style={styles.email}>{email || 'No Email Available'}</Text>

      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>

      {/* Awesome Alert for logout confirmation */}
      <AwesomeAlert
        show={showAlert}
        showProgress={false}
        title={alertTitle}
        message={alertMessage}
        closeOnTouchOutside={false}
        closeOnHardwareBackPress={false}
        showConfirmButton={true}
        showCancelButton={showCancelButton}
        confirmText={confirmText}
        confirmButtonColor="#7a1f6f"
        cancelButtonColor="#999"
        onCancelPressed={() => setShowAlert(false)}
        onConfirmPressed={async () => {
          const action = onConfirmAction;
          setShowAlert(false);
          if (action) {
            setTimeout(() => {
              action();
            }, 300);
          }
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
    backgroundColor: '#f2f7f5',
  },
  avatar: {
    width: 300,
    height: 300,
    borderRadius: 10,
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A5568',
    marginBottom: 10,
  },
  email: {
    fontSize: 18,
    color: '#718096',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#FF3BBF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '80%',
    marginVertical: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
