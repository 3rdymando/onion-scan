import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Camera } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../firebase.js'; 
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import axios from 'axios';

const CLOUDINARY_UPLOAD_PRESET = 'pests-images'; // replace 
const CLOUDINARY_CLOUD_NAME = 'dqfiqexpu';       // replace 

export const uploadToCloudinary = async (imageUri) => {
  const data = new FormData();
  data.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'upload.jpg',
  });
  data.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  data.append('cloud_name', CLOUDINARY_CLOUD_NAME);

  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/dqfiqexpu/image/upload`,
      data,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload to Cloudinary.');
  }
};

const getFarmerName = async (userId) => {
  if (!userId) return 'Unknown Farmer';
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data().name || 'Unnamed Farmer';
    }
    return 'Unknown Farmer';
  } catch (error) {
    console.error('Error fetching farmer name:', error);
    return 'Unknown Farmer';
  }
};

const { height } = Dimensions.get('window');

const OnionScanApp = ({ navigation }) => {
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasMediaPermission, setHasMediaPermission] = useState(null);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    (async () => {
      // Get Firebase Auth current user
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        setUserId(user.uid);
      } else {
        Alert.alert('User not logged in', 'Please log in to use the app.');
        navigation.navigate('Login'); // redirect if needed
      }

      // Request permissions
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === 'granted');

      const mediaStatus = await Location.requestForegroundPermissionsAsync();
      setHasMediaPermission(mediaStatus.status === 'granted');

      const locationStatus = await Location.requestForegroundPermissionsAsync();
      setLocationPermissionStatus(locationStatus.status);
    })();
  }, []);

  const requestLocationPermission = async () => {
    setLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    const servicesEnabled = await Location.hasServicesEnabledAsync();

    if (status !== 'granted') {
      Alert.alert('Location Access', 'Permission denied.');
      setLoading(false);
      return { granted: false };
    }

    if (!servicesEnabled) {
      Alert.alert(
        'Location Services Disabled',
        'Please enable GPS/location services in your device settings.');
        setLoading(false); 
      return { granted: false };
    }

    try {
      const location = await Location.getCurrentPositionAsync({});
      Alert.alert('Location Access', 'Permission granted and GPS is ON!');
      setLoading(false);
      return {
        granted: true,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      Alert.alert('Location Error', 'Failed to get location: ' + error.message);
      setLoading(false);
      return { granted: false };
    }
  };

  const requestBackgroundLocationPermission = async () => {
    const { status } = await Location.requestBackgroundPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Background Location Access', 'Permission denied.');
      return;
    }

    Alert.alert('Background Location Access', 'Background location access granted!');
  };

  // Pest details mapping based on predicted class
  const getPestDetails = (predictedClass) => {
    const pestDetails = {
      Armyworm: {
        title: 'Armyworm',
        order: 'Lepidoptera',
        family: 'Noctuidae',
        species: 'Mythimna unipuncta',
        damageCharacteristics: 'Chews leaves, causing irregular holes; can defoliate crops.',
        treatmentRecommendations: 'Use Bacillus thuringiensis (Bt) or chemical insecticides; remove crop debris.',
      },
      Cutworm: {
        title: 'Cutworm',
        order: 'Lepidoptera',
        family: 'Noctuidae',
        species: 'Agrotis spp.',
        damageCharacteristics: 'Cuts stems at soil level; feeds on roots and leaves.',
        treatmentRecommendations: 'Use collars around seedlings; apply insecticides at dusk.',
      },
      Red_Spider_Mites: {
        title: 'Red Spider Mites',
        order: 'Acari',
        family: 'Tetranychidae',
        species: 'Tetranychus urticae',
        damageCharacteristics: 'Sucks sap, causing stippling, yellowing, and webbing on leaves.',
        treatmentRecommendations: 'Use miticides; increase humidity; introduce predatory mites.',
      },
    };
    return pestDetails[predictedClass] || {
      title: predictedClass,
      order: 'Unknown',
      family: 'Unknown',
      species: 'Unknown',
      damageCharacteristics: 'N/A',
      treatmentRecommendations: 'N/A',
    };
  };

  const savePrediction = async (pestDetails, latitude, longitude) => {
    try {
      if (!userId) {
        Alert.alert('Error', 'User not authenticated.');
        return;
      }

      const farmerName = await getFarmerName(userId);

      const now = new Date();
      const date = now.toISOString().split('T')[0];
      const time = now.toTimeString().split(' ')[0];

      const scanData = {
        id: Date.now().toString(),
        result: pestDetails.title,
        date,
        time,
        image: pestDetails.image,
        latitude,
        longitude,
        details: pestDetails,
        farmerName,
        userId,
      };

      // Save locally
      const existingScans = await AsyncStorage.getItem('scannedPests');
      const scans = existingScans ? JSON.parse(existingScans) : [];
      scans.push(scanData);
      await AsyncStorage.setItem('scannedPests', JSON.stringify(scans));

      // Save to Firestore
      await addDoc(collection(db, 'pestScans'), scanData);

      console.log('Prediction saved locally and to Firestore:', scanData);
      Alert.alert('Success', 'Prediction saved successfully.');
    } catch (error) {
      console.error('Error saving prediction:', error);
      Alert.alert('Save Error', 'Failed to save prediction: ' + error.message);
    }
  };

  const callPredictionAPI = async (imageUri, latitude, longitude) => {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        name: 'image.jpg',
        type: 'image/jpeg',
      });
      formData.append('latitude', latitude.toString());
      formData.append('longitude', longitude.toString());

      const response = await fetch('https://qjbferrer-onionscanserver.hf.space/predict', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error);
      }

      return result;
    } catch (error) {
      Alert.alert('Prediction Error', error.message);
      return null;
    }
  };

const handleImageSelection = async (imageUri) => {
  const locationResult = await requestLocationPermission();
  if (!locationResult.granted) return;

  const { latitude, longitude } = locationResult;

  setLoading(true); // Start loading

  try {
    // 🔼 Upload image to Cloudinary
    const uploadedImageUrl = await uploadToCloudinary(imageUri);

    // 🔮 Get prediction using Cloudinary URL
    const prediction = await callPredictionAPI(uploadedImageUrl, latitude, longitude);

    if (prediction) {
      const pestDetails = getPestDetails(prediction.predicted_class);
      pestDetails.image = uploadedImageUrl; // Use the Cloudinary URL
      pestDetails.latitude = latitude;
      pestDetails.longitude = longitude;

      await savePrediction(pestDetails, latitude, longitude);
      navigation.navigate('ResultScreen', { item: pestDetails });
    }
  } catch (error) {
    Alert.alert('Error', error.message);
  } finally {
    setLoading(false); // End loading
  }
};

  const handleCapturePest = async () => {
    if (!hasCameraPermission) {
      Alert.alert('Error', 'Camera permission not granted');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      handleImageSelection(imageUri);
    }
  };

  const handleSelectFromGallery = async () => {
    if (!hasMediaPermission) {
      Alert.alert('Error', 'Media library permission not granted');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      handleImageSelection(imageUri);
    }
  };

  const handleOpenLibrary = () => {
    navigation.navigate('Library');
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.container, { minHeight: height }]}
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/onionscan.png')}
              style={styles.logoCentered}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.welcome}>Welcome back, User!</Text>
          <Text style={styles.subtitle}>Scan pest to protect your crops.</Text>
        </View>

        <View style={styles.main}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCapturePest}>
            <Image source={require('../assets/camera.png')} style={styles.icon} />
            <Text style={styles.buttonText}>
              Capture Onion Pests{'\n'}using Camera
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleSelectFromGallery}>
            <Image source={require('../assets/gallery.png')} style={styles.icon} />
            <Text style={styles.buttonText}>
              Select From Your{'\n'}Gallery
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.libraryButton}
            onPress={handleOpenLibrary}
          >
            <Text style={styles.libraryButtonText}>
              ONION PEST OFFLINE LIBRARY
            </Text>
          </TouchableOpacity>
          <Text style={styles.infoText}>
            Browse the full list of onion pests offline.
          </Text>
        </View>
      </ScrollView>

            {/* Loading Indicator Overlay */}
      <Modal transparent={true} animationType="fade" visible={loading}>
        <View style={styles.loadingOverlay}>
          <View style={styles.spinnerContainer}></View>
          <ActivityIndicator size="large" color="#7a1f6f" style={styles.spinner} />
          <Text style={styles.loadingText}>Analyzing image. Please Wait....</Text>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#7a1f6f',
    marginLeft: 10,
  },
  welcome: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5a00',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5a00',
  },
  main: {
    width: '100%',
    marginTop: 10,
    alignItems: 'center',
  },
  actionButton: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#666',
    borderRadius: 10,
    backgroundColor: '#fff',
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4a5a00',
    textAlign: 'center',
    lineHeight: 20,
  },
  libraryButton: {
    width: '100%',
    backgroundColor: '#ee33b7',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  libraryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  infoText: {
    fontSize: 12,
    color: '#4a5a00',
    textAlign: 'center',
    marginTop: 6,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 1,
  },
  logoCentered: {
    width: 370,
    height: 80,
  },
  icon: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#fff',
    fontSize: 16,
  },
});

export default OnionScanApp;