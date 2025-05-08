import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [name, setName] = useState('Rachel'); // Initial name set to Rachel
  const [isEditing, setIsEditing] = useState(false); // Toggle editing mode

  const handleLogout = () => {
    // Handle any additional logout logic here if needed (e.g., clear user data, tokens, etc.)
    navigation.navigate('FrontPage'); // Navigate to the FrontPage screen
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  const saveName = () => {
    setIsEditing(false);
    // Additional logic for saving the name (e.g., to a database) can be added here
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/logo.png')}
        style={styles.avatar}
      />
      {isEditing ? (
        <TextInput
          style={styles.nameInput}
          value={name}
          onChangeText={setName}
          autoFocus
        />
      ) : (
        <Text style={styles.name}>{name}</Text>
      )}

      {/* Edit Profile Button */}
      <TouchableOpacity style={styles.button} onPress={isEditing ? saveName : toggleEdit}>
        <Text style={styles.buttonText}>{isEditing ? 'Save' : 'Edit Profile'}</Text>
      </TouchableOpacity>

      {/* Logout Button */}
      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // Light background color
  },
  avatar: {
    width: 300,
    height: 300,
    borderRadius: 10, // Adjust to make the image fit better in a square shape
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A5568', // Dark color for text
    marginBottom: 20,
  },
  nameInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A5568', // Match text color to the previous text
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#4A5568', // Border to match text color
    width: '80%',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#FF3BBF', // Pink background for buttons
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '80%',
    marginVertical: 10,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
