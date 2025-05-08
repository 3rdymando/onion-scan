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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Camera } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height } = Dimensions.get('window');

const OnionScanApp = ({ navigation }) => {
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasMediaPermission, setHasMediaPermission] = useState(null);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState(null);

  useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === 'granted');

      const mediaStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasMediaPermission(mediaStatus.status === 'granted');

      const locationStatus = await Location.requestForegroundPermissionsAsync();
      setLocationPermissionStatus(locationStatus.status);
    })();
  }, []);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    const servicesEnabled = await Location.hasServicesEnabledAsync();

    if (status !== 'granted') {
      Alert.alert('Location Access', 'Permission denied.');
      return { granted: false };
    }

    if (!servicesEnabled) {
      Alert.alert(
        'Location Services Disabled',
        'Please enable GPS/location services in your device settings.'
      );
      return { granted: false };
    }

    try {
      const location = await Location.getCurrentPositionAsync({});
      Alert.alert('Location Access', 'Permission granted and GPS is ON!');
      return {
        granted: true,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      Alert.alert('Location Error', 'Failed to get location: ' + error.message);
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
        filipinoNames: 'N/A',
        stagesOfDevelopment: 'Egg, Larva, Pupa, Adult',
        damageCharacteristics: 'Chews leaves, causing irregular holes; can defoliate crops.',
        treatmentRecommendations: 'Use Bacillus thuringiensis (Bt) or chemical insecticides; remove crop debris.',
      },
      Cutworm: {
        title: 'Cutworm',
        order: 'Lepidoptera',
        family: 'Noctuidae',
        species: 'Agrotis spp.',
        filipinoNames: 'N/A',
        stagesOfDevelopment: 'Egg, Larva, Pupa, Adult',
        damageCharacteristics: 'Cuts stems at soil level; feeds on roots and leaves.',
        treatmentRecommendations: 'Use collars around seedlings; apply insecticides at dusk.',
      },
      Red_Spider_Mites: {
        title: 'Red Spider Mites',
        order: 'Acari',
        family: 'Tetranychidae',
        species: 'Tetranychus urticae',
        filipinoNames: 'N/A',
        stagesOfDevelopment: 'Egg, Larva, Nymph, Adult',
        damageCharacteristics: 'Sucks sap, causing stippling, yellowing, and webbing on leaves.',
        treatmentRecommendations: 'Use miticides; increase humidity; introduce predatory mites.',
      },
    };
    return pestDetails[predictedClass] || {
      title: predictedClass,
      order: 'Unknown',
      family: 'Unknown',
      species: 'Unknown',
      filipinoNames: 'N/A',
      stagesOfDevelopment: 'N/A',
      damageCharacteristics: 'N/A',
      treatmentRecommendations: 'N/A',
    };
  };

  const savePrediction = async (pestDetails, latitude, longitude) => {
    try {
      const now = new Date();
      const date = now.toISOString().split('T')[0];
      const time = now.toTimeString().split(' ')[0];
  
      const scanData = {
        id: Date.now().toString(),
        result: pestDetails.title,
        date: date,
        time: time,
        image: pestDetails.image, // The image URI
        latitude: latitude,
        longitude: longitude,
        details: pestDetails,
      };
  
      console.log('Saving prediction to AsyncStorage:', scanData);
  
      const existingScans = await AsyncStorage.getItem('scannedPests');
      console.log('Existing scans from AsyncStorage:', existingScans);
  
      const scans = existingScans ? JSON.parse(existingScans) : [];
      console.log('Parsed scans:', scans);
  
      scans.push(scanData);
      console.log('Updated scans array:', scans);
  
      await AsyncStorage.setItem('scannedPests', JSON.stringify(scans));
      console.log('Prediction saved successfully:', scanData);
  
      // Verify the save by immediately reading the data back
      const savedScans = await AsyncStorage.getItem('scannedPests');
      console.log('Saved scans after writing:', savedScans);
    } catch (error) {
      console.error('Error saving prediction to AsyncStorage:', error);
      Alert.alert('Storage Error', 'Failed to save prediction: ' + error.message);
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

      const response = await fetch('https://68gw0r1w-5000.asse.devtunnels.ms/predict', {
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

    const prediction = await callPredictionAPI(imageUri, latitude, longitude);
    if (prediction) {
      const pestDetails = getPestDetails(prediction.predicted_class);
      pestDetails.image = imageUri;
      pestDetails.latitude = latitude;
      pestDetails.longitude = longitude;
      await savePrediction(pestDetails, latitude, longitude);
      navigation.navigate('ResultScreen', { item: pestDetails });
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
});

export default OnionScanApp;