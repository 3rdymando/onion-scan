import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase.js';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase.js';
import AwesomeAlert from 'react-native-awesome-alerts';
import { Picker } from '@react-native-picker/picker'; // for dropdown

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [sex, setSex] = useState('');
  const [password, setPassword] = useState('');

  // Alert state
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

  const handleSignup = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

  await setDoc(doc(db, 'users', user.uid), {
    name,
    email,
    contactNumber,
    sex: sex || 'Male',   // fallback to Male if empty
    createdAt: new Date(),
  });

      showCustomAlert('Success', 'Account created successfully!', () => {
        setShowAlert(false);
        navigation.navigate('Login');
      });
    } catch (error) {
      let errorMessage = 'Signup failed';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already in use.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters.';
      }

      showCustomAlert('Signup Error', errorMessage);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <Image source={require('../assets/logo.png')} style={styles.logo} />

        <Text style={styles.title}>CREATE NEW ACCOUNT</Text>
        <Text style={styles.subTitle}>
          Fill in your contact details below if you have no account.
        </Text>

        {/* Contact Details Section */}
        <Text style={styles.sectionTitle}>Contact Details</Text>

        <Text style={styles.helperText}>
          <Text style={{ fontStyle: 'italic' }}>(First Name, Last Name)</Text>
        </Text>

        {/* Name */}
        <TextInput
          style={styles.input}
          placeholder="Name"
          placeholderTextColor="#FFF"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.helperText}>
          <Text style={{ fontStyle: 'italic' }}>(name@gmail.com)</Text>
        </Text>

        {/* Email */}
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor="#FFF"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.helperText}>
          <Text style={{ fontStyle: 'italic' }}>(09*********)</Text>
        </Text>

        {/* Contact Number */}
        <TextInput
          style={styles.input}
          placeholder="Contact Number"
          placeholderTextColor="#FFF"
          value={contactNumber}
          onChangeText={setContactNumber}
          keyboardType="phone-pad"
        />

        {/* Password */}
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#FFF"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* Sex Section */}
        <Text style={styles.sectionTitle}>Gender</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={sex}
            onValueChange={(itemValue) => setSex(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Male" value="Male" />
            <Picker.Item label="Female" value="Female" />
          </Picker>
        </View>

        {/* Signup Button */}
        <TouchableOpacity style={styles.button} onPress={handleSignup}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Already registered? Login</Text>
        </TouchableOpacity>

        {/* Awesome Alert */}
        <AwesomeAlert
          show={showAlert}
          title={alertTitle}
          message={alertMessage}
          showConfirmButton={true}
          confirmText="OK"
          confirmButtonColor="#7a1f6f"
          onConfirmPressed={() => {
            setShowAlert(false);
            if (onConfirmAction) onConfirmAction();
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { 
    flexGrow: 1, 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    padding: 20,
  },
  logo: { 
    width: 200, 
    height: 200, 
    resizeMode: 'contain', 
    marginBottom: 10 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#4A0D67', 
    marginBottom: 8 
  },
  subTitle: { 
    fontSize: 12.6, 
    color: '#6B7280', 
    marginBottom: 16, 
    textAlign: 'center' 
  },
  input: { 
    width: '100%', 
    padding: 15, 
    backgroundColor: '#4B6600', 
    borderRadius: 10, 
    marginBottom: 10, 
    color: '#FFF' 
  },
  pickerContainer: { 
    width: '100%', 
    backgroundColor: '#4B6600', 
    borderRadius: 10, 
    marginBottom: 10 
  },
  picker: { 
    color: '#FFF', 
    height: 50, 
    width: '100%' 
  },
  button: { 
    backgroundColor: '#FF3BBF', 
    padding: 15, 
    borderRadius: 10, 
    alignItems: 'center', 
    width: '100%', 
    marginTop: 10 
  },
  buttonText: { 
    color: '#FFF', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  link: { 
    color: '#4A0D67', 
    fontWeight: '500', 
    marginTop: 20 
  },
  helperText: { 
    color: '#6B7280', 
    fontSize: 12, 
    marginBottom: 10, 
    alignSelf: 'flex-start' 
  },
  sectionTitle: {
    alignSelf: 'flex-start',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4A0D67',
    marginBottom: 5,
    marginTop: 15,
  },
});
