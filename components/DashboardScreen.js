import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';
import { Camera } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../firebase.js'; 
import { collection, addDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import axios from 'axios';
import AwesomeAlert from 'react-native-awesome-alerts';  // NEW
import { ImageEditor } from "expo-dynamic-image-crop";


const getAddressFromCoords = async (lat, lng) => {
  const accessToken = 'pk.eyJ1IjoicWpiZmVycmVyIiwiYSI6ImNtYTlqbDEyaTBrYnUya3BzeHd4ZWFnOXMifQ.PeNfgVuGD53Au8Vmkpe2RQ';
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=address,poi&limit=3&country=ph&proximity=${lng},${lat}&access_token=${accessToken}`
    );

    const data = await response.json();
    if (data.features && data.features.length > 0) {
      const best = data.features
        .filter(f => f.relevance > 0.8)
        .sort((a, b) => b.relevance - a.relevance)[0];

      return best ? best.place_name : data.features[0].place_name;
    } else {
      return 'Unknown Location';
    }
  } catch (error) {
    console.error('Error in reverse geocoding:', error);
    return 'Unknown Location';
  }
};

const CLOUDINARY_UPLOAD_PRESET = 'pests-images';
const CLOUDINARY_CLOUD_NAME = 'dqfiqexpu';

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

// NEW: Extract location from image EXIF data
const getLocationFromImageExif = async (imageUri) => {
  try {
    console.log('Attempting to extract location from URI:', imageUri);
    
    // Try to get asset info directly from the URI
    const permission = await MediaLibrary.requestPermissionsAsync();
    if (permission.status !== 'granted') {
      console.log('Media library permission not granted');
      return { hasLocation: false };
    }

    // Extract asset ID from URI if possible
    const assetId = imageUri.split('/').pop()?.split('.')[0];
    console.log('Extracted asset ID:', assetId);

    if (assetId) {
      try {
        // Try to get asset info using the ID
        const assetInfo = await MediaLibrary.getAssetInfoAsync(assetId);
        console.log('Asset info:', assetInfo);
        
        if (assetInfo && assetInfo.location) {
          console.log('Location found:', assetInfo.location);
          return {
            latitude: assetInfo.location.latitude,
            longitude: assetInfo.location.longitude,
            hasLocation: true,
          };
        }
      } catch (e) {
        console.log('Could not get asset info from ID:', e);
      }
    }

    // Fallback: search through all recent assets
    console.log('Searching through media library assets...');
    const assets = await MediaLibrary.getAssetsAsync({
      first: 100,
      mediaType: 'photo',
      sortBy: [[MediaLibrary.SortBy.creationTime, false]],
    });

    if (!assets.assets || assets.assets.length === 0) {
      console.log('No assets found in media library');
      return { hasLocation: false };
    }

    // Log all assets and their locations
    console.log('Total assets found:', assets.assets.length);
    for (const asset of assets.assets) {
      console.log('Asset:', asset.id, 'Location:', asset.location);
      
      if (asset.location && asset.location.latitude && asset.location.longitude) {
        // Return first asset with location as fallback
        return {
          latitude: asset.location.latitude,
          longitude: asset.location.longitude,
          hasLocation: true,
          fromFallback: true,
        };
      }
    }

    console.log('No assets with location found');
    return { hasLocation: false };
  } catch (error) {
    console.error('Error extracting EXIF location:', error);
    return { hasLocation: false };
  }
};

const { height } = Dimensions.get('window');

const OnionScanApp = ({ navigation }) => {
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasMediaPermission, setHasMediaPermission] = useState(null);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  // NEW state for cropping
  const [isEditing, setIsEditing] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);

  // NEW: farmer name
  const [farmerName, setFarmerName] = useState('');

  // AwesomeAlert state
  const [showAlert, setShowAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  // NEW: minimize
  const [minimized, setMinimized] = useState(false);

  // NEW: location from metadata
  const [pendingImageLocation, setPendingImageLocation] = useState(null);

  const showCustomAlert = (title, message) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setShowAlert(true);
  };

  // Rotating loading messages
  const loadingMessages = [
    "Uploading image...",
    "Predicting pest type...",
    "Saving to database..."
  ];
  // Custom durations for each message (ms)
  const loadingDurations = [
    5000,   // Uploading image → 5s
    10000,  // Predicting pest type → 10s
    5000    // Saving to database → 5s
  ];
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    (async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        setUserId(user.uid);
        const name = await getFarmerName(user.uid);
        setFarmerName(name);
      } else {
        showCustomAlert('User not logged in', 'Please log in to use the app.');
        navigation.navigate('Login');
      }

      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === 'granted');

      const mediaStatus = await MediaLibrary.requestPermissionsAsync();
      setHasMediaPermission(mediaStatus.status === 'granted');

      const locationStatus = await Location.requestForegroundPermissionsAsync();
      setLocationPermissionStatus(locationStatus.status);
    })();
  }, []);

  // Handle rotating loading messages with different durations
  useEffect(() => {
    let timeouts = [];

    if (loading) {
      setLoadingStep(0);

      let totalDelay = 0;
      for (let i = 0; i < loadingMessages.length - 1; i++) {
        totalDelay += loadingDurations[i];
        const timeout = setTimeout(() => {
          setLoadingStep(i + 1);
        }, totalDelay);
        timeouts.push(timeout);
      }
    } else {
      setLoadingStep(0);
    }

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [loading]);

  const requestLocationPermission = async () => {
    setLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    const servicesEnabled = await Location.hasServicesEnabledAsync();

    if (status !== 'granted') {
      showCustomAlert('Location Access', 'Permission denied.');
      setLoading(false);
      return { granted: false };
    }

    if (!servicesEnabled) {
      showCustomAlert(
        'Location Services Disabled',
        'Please enable GPS/location services in your device settings.'
      );
      setLoading(false);
      return { granted: false };
    }

    try {
      const location = await Location.getCurrentPositionAsync({});
      showCustomAlert('Location Access', 'Permission granted and GPS is ON!');
      setLoading(false);
      return {
        granted: true,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      showCustomAlert('Location Error', 'Failed to get location: ' + error.message);
      setLoading(false);
      return { granted: false };
    }
  };

  const requestBackgroundLocationPermission = async () => {
    const { status } = await Location.requestBackgroundPermissionsAsync();
    if (status !== 'granted') {
      showCustomAlert('Background Location Access', 'Permission denied.');
      return;
    }
    showCustomAlert('Background Location Access', 'Background location access granted!');
  };

  const getPestDetails = (predictedClass) => {
    if (predictedClass === 'unidentified') {
      predictedClass = 'unidentified';
    }
    const pestDetails = {
      "onion_armyworm": {
        title: 'Onion Armyworm',
        order: 'Lepidoptera',
        family: 'Noctuidae',
        species: 'Spodoptera frugiperda',
        damageCharacteristics: [
          'Young larvae feed by scaping the leaves.', 
          'Larger larvae make irregular holes in the leaves or eat the leaves completely.', 
          'Defoliation, blighting, and drying of onion leaves.'],
        treatmentRecommendations: [
          {
            category: 'Cultural Control',
            methods: [
              'Field Sanitation',
              'Plow under the plant residue to reduce the population of the pests in the area.',
              'Plant trap crops like sunflower or taro plants around the area.'
            ]
          },
          {
            category: 'Biological Control Agents (BCAs)',
            methods: [
              'Release egg parasitoids (Trichogramma sp.) and predators such as earwig.',
              'Use entomopathogens (M. anisopliae) and Nucleopolyhedrosis virus (NPV).'
            ]
          },
          {
            category: 'Chemical Control',
            methods: [
              'Use FPA-registered pesticides following the manufacturer’s recommendation.',
              'Avoid excessive use of chemicals to prevent pesticide resistance.'
            ]
          }
        ]
      },
      "fall_armyworm": {
        title: 'Fall Armyworm',
        order: 'Lepidoptera',
        family: 'Noctuidae',
        species: 'Spodoptera exigua',
        damageCharacteristics: [
          'Feeding damage on tassels.', 
          'Window-pane damage by younger instars on leaves.', 
          'Larvae cutting off seedling at ground level by chewing through the stem.', 
          'Foliar damage is usually characterized by ragged feeding and moist sawdust-like frass near the whorl and upper leaves of the plant.'],
        treatmentRecommendations: [
          {
            category: 'Cultural Control',
            methods: [
              'Crop rotation',
              'Plowing under stubbles after harvest.',
              'Practice synchronous planting within the cluster area.',
              'Practice proper field sanitation to destroy weeds that serves as an alternate host.',
              'Collection and crushing of egg masses and larvae.'
            ]
          },
          {
            category: 'Biological Control Agents (BCAs)',
            methods: [
              'Release of predators (earwig and lacewing), parasitoids (Trichogramma), and entomopathogenic nematode (EPN).',
              'Use of entomopathogenic fungi like Metarhizium anisopliae and Beauveria bassiana.',
              'Use of nucleo polyhedrosis virus (NPV).'
            ]
          },
          {
            category: 'Chemical Control',
            methods: [
              'Use of FPA-registered pesticides following the manufacturer’s recommendation.',
              'Avoid excessive use of chemicals to prevent the development of pesticide resistance.'
            ]
          }
        ]
      },
      "cutworm": {
        title: 'Cutworm',
        order: 'Lepidoptera',
        family: 'Noctuidae',
        species: 'Spodoptera litura',
        damageCharacteristics: [
          'Young plants are completely defoliated.', 
          'Early cutworm feeding may include holes chewed in leaves.', 
          'Leaf margins appear ragged.', 
          'In high infestation, stem, leaves, and host crops are almost consumed.'],
        treatmentRecommendations: [
          {
            category: 'Cultural Control',
            methods: [
              'Crop rotation and plow fields to remove weeds which may serve as alternate hosts.',
              'Use of resistant varieties.'
            ]
          },
          {
            category: 'Biological Control Agents (BCAs)',
            methods: [
              'Release 70 cards of T. chilonis per hectara. Repeat application after 1 week.',
              'Release 10,000 earwig adults (Euborella annulata) per hectare.',
              'Use 25-30 bags (400 grams/bag) of N. anisopliae and B. bassiana per hectare.',
              'Use 10 bottles (10pc/bot) of nucleo polyhedrosis virus (NPV).'
            ]
          },
          {
            category: 'Chemical Control',
            methods: [
              'Use of Bt corn hybrids.',
              'Use of FPA-registered pesticides following the manufacturer’s recommendation.',
              'Avoid excessive use of chemicals to prevent the development of pesticide resistance.'
            ]
          }
        ]
      },
      "unidentified": {
        title: 'Unidentified',
        order: 'Unknown',
        family: 'Unknown',
        species: 'Unknown',
        damageCharacteristics: 'No known damage; likely not a pest.',
        treatmentRecommendations: 'No treatment needed.',
      }
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

  const savePrediction = async (pestDetails, latitude, longitude, locationAddress, dateTimeOriginal = null) => {
    try {
      if (!userId) {
        showCustomAlert('Error', 'User not authenticated.');
        return;
      }
      const farmerName = await getFarmerName(userId);
      
      // Use DateTimeOriginal from EXIF if available, otherwise use current time
      let date, time;
      if (dateTimeOriginal) {
        // DateTimeOriginal format is typically "YYYY:MM:DD HH:MM:SS"
        const [datePart, timePart] = dateTimeOriginal.split(' ');
        date = datePart.replace(/:/g, '-'); // Convert "YYYY:MM:DD" to "YYYY-MM-DD"
        time = timePart || '00:00:00';
      } else {
        const now = new Date();
        date = now.toISOString().split('T')[0];
        time = now.toTimeString().split(' ')[0];
      }
      
      const generatedId = Date.now().toString();

      const scanData = {
        id: generatedId,
        result: pestDetails.title,
        confidence: pestDetails.confidence,
        date,
        time,
        image: pestDetails.image,
        latitude,
        longitude,
        locationAddress,
        details: pestDetails,
        farmerName,
        userId,
        verificationStatus: "Pending"
      };

      await setDoc(doc(db, 'pestScans', generatedId), scanData);

      return generatedId;
    } catch (error) {
      console.error('Error saving prediction:', error);
      showCustomAlert('Save Error', 'Failed to save prediction: ' + error.message);
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
      showCustomAlert('Prediction Error', error.message);
      return null;
    }
  };

  const handleImageSelection = async (imageUri) => {
    let locationResult;

    // NEW: If we have location from EXIF, use it; otherwise request GPS
    if (pendingImageLocation?.source === 'exif') {
      locationResult = {
        granted: true,
        latitude: pendingImageLocation.latitude,
        longitude: pendingImageLocation.longitude,
      };
      showCustomAlert(
        'Using Image Location',
        'Using location from image EXIF data'
      );
    } else {
      locationResult = await requestLocationPermission();
    }

    if (!locationResult.granted) return;

    const { latitude, longitude } = locationResult;
    setLoading(true);

    try {
      const locationAddress = await getAddressFromCoords(latitude, longitude);
      const uploadedImageUrl = await uploadToCloudinary(imageUri);
      const prediction = await callPredictionAPI(uploadedImageUrl, latitude, longitude);

      if (prediction) {
        const pestDetails = getPestDetails(prediction.predicted_class);
        pestDetails.image = uploadedImageUrl;
        pestDetails.latitude = latitude;
        pestDetails.longitude = longitude;
        pestDetails.confidence = (prediction.confidence * 100).toFixed(2) + '%';
        pestDetails.locationAddress = locationAddress;
        // NEW: Track location source and datetime
        pestDetails.locationSource = pendingImageLocation?.source || 'gps';
        pestDetails.dateTimeOriginal = pendingImageLocation?.dateTimeOriginal || null;

        const id = await savePrediction(
        pestDetails, 
        latitude, 
        longitude, 
        locationAddress,
        pendingImageLocation?.dateTimeOriginal
      );
        if (id) {
          navigation.navigate('ResultScreen', { item: id });
        }
      }
    } catch (error) {
      showCustomAlert('Error', error.message);
    } finally {
      setLoading(false);
      setMinimized(false);
      // NEW: Clear after use
      setPendingImageLocation(null);
    }
  };

  // Helper function to convert GPS coordinates from DMS to Decimal Degrees
  const convertDMSToDD = (dms, ref) => {
    if (!dms || !Array.isArray(dms) || dms.length < 3) {
      return null;
    }

    try {
      const degrees = dms[0];
      const minutes = dms[1];
      const seconds = dms[2];

      let dd = degrees + minutes / 60 + seconds / 3600;

      // If South or West, make negative
      if (ref === 'S' || ref === 'W') {
        dd = -dd;
      }

      return dd;
    } catch (error) {
      console.error('Error converting DMS to DD:', error);
      return null;
    }
  };

  // Helper function to validate coordinates
  const isValidCoordinate = (lat, lng) => {
    // Check if coordinates exist, are not 0,0, and are within valid ranges
    if (lat === null || lng === null || lat === undefined || lng === undefined) {
      return false;
    }
    if (lat === 0 && lng === 0) {
      return false; // Null Island - likely GPS was disabled
    }
    // Check if within valid latitude/longitude ranges
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return false;
    }
    return true;
  };

  // Helper function to extract location and datetime from EXIF data
  const extractLocationFromExif = (exif) => {
    if (!exif || !exif.GPSLatitude || !exif.GPSLongitude) {
      return null;
    }

    let latitude, longitude;

    // Check if coordinates are in DMS format (array) or already decimal (number)
    if (Array.isArray(exif.GPSLatitude)) {
      // DMS format - convert to decimal
      latitude = convertDMSToDD(
        exif.GPSLatitude,
        exif.GPSLatitudeRef || 'N'
      );
      longitude = convertDMSToDD(
        exif.GPSLongitude,
        exif.GPSLongitudeRef || 'E'
      );
    } else if (typeof exif.GPSLatitude === 'number' && typeof exif.GPSLongitude === 'number') {
      // Already in decimal format
      latitude = exif.GPSLatitude;
      longitude = exif.GPSLongitude;
      
      // Apply hemisphere correction based on refs
      if (exif.GPSLatitudeRef === 'S' && latitude > 0) {
        latitude = -latitude;
      }
      if (exif.GPSLongitudeRef === 'W' && longitude > 0) {
        longitude = -longitude;
      }
    } else {
      console.log('Unknown GPS coordinate format:', typeof exif.GPSLatitude);
      return null;
    }

    // Extract DateTimeOriginal if available
    const dateTimeOriginal = exif.DateTimeOriginal || null;
    if (dateTimeOriginal) {
      console.log('DateTimeOriginal from EXIF:', dateTimeOriginal);
    }

    // Validate the coordinates
    if (latitude && longitude && isValidCoordinate(latitude, longitude)) {
      return { 
        latitude, 
        longitude,
        dateTimeOriginal // Add datetime to returned object
      };
    } else {
      console.log('Invalid coordinates:', latitude, longitude);
      return null;
    }
  };

  const handleSelectFromGallery = async () => {
    if (!hasMediaPermission) {
      showCustomAlert('Error', 'Media library permission not granted');
      return;
    }

    try {
      // Step 1: Use ImagePicker to let user select
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        exif: true, // Request EXIF data
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const selectedUri = result.assets[0].uri;
      
      // Step 2: Try to get location from ImagePicker EXIF first
      let locationFound = false;
      let exifLocation = null;

      if (result.assets[0].exif) {
        const exif = result.assets[0].exif;
        console.log('EXIF data available:', exif);
        
        // Extract location using helper function
        exifLocation = extractLocationFromExif(exif);
        
        if (exifLocation) {
          locationFound = true;
          console.log('Location from EXIF:', exifLocation);
        }
      }

      // Step 3: Fallback - search through recent photos with location
      if (!locationFound) {
        console.log('No EXIF location, trying to find recent photo with location...');
        
        // Get recent assets to search through
        const recentAssets = await MediaLibrary.getAssetsAsync({
          first: 100,
          mediaType: 'photo',
          sortBy: [[MediaLibrary.SortBy.creationTime, false]],
        });

        // Search for the first photo with valid location
        for (const asset of recentAssets.assets) {
          try {
            const assetInfo = await MediaLibrary.getAssetInfoAsync(asset.id);
            
            if (assetInfo.location && 
                isValidCoordinate(assetInfo.location.latitude, assetInfo.location.longitude)) {
              exifLocation = {
                latitude: assetInfo.location.latitude,
                longitude: assetInfo.location.longitude,
              };
              locationFound = true;
              console.log('Using location from recent photo:', exifLocation);
              showCustomAlert(
                'Location Estimate',
                'Using location from a recent photo. For best accuracy, enable location in your camera settings.'
              );
              break;
            }
          } catch (error) {
            console.log('Error reading asset info:', error);
          }
        }
      }

      // Step 4: Set location or prepare for GPS fallback
      if (locationFound && exifLocation) {
        setPendingImageLocation({
          latitude: exifLocation.latitude,
          longitude: exifLocation.longitude,
          dateTimeOriginal: exifLocation.dateTimeOriginal, // Include datetime
          source: 'exif',
        });
        
        const locationMsg = `Using location from image:\n${exifLocation.latitude.toFixed(4)}, ${exifLocation.longitude.toFixed(4)}`;
        const dateMsg = exifLocation.dateTimeOriginal 
          ? `\n\nPhoto taken: ${exifLocation.dateTimeOriginal}` 
          : '';
        
        showCustomAlert(
          'Location Found',
          locationMsg + dateMsg
        );
      } else {
        showCustomAlert(
          'No Location in Image',
          'Image has no location data. Will use current GPS location.'
        );
        setPendingImageLocation(null);
      }

      // Step 5: Open crop editor
      setPendingImage(selectedUri);
      setIsEditing(true);

    } catch (error) {
      console.error('Error selecting from gallery:', error);
      showCustomAlert('Error', 'Failed to access gallery: ' + error.message);
    }
  };

  const handleCapturePest = async () => {
    if (!hasCameraPermission) {
      showCustomAlert('Error', 'Camera permission not granted');
      return;
    }

    try {
      let result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        exif: true, // Request EXIF data including location
      });

      if (!result.canceled && result.assets?.length > 0) {
        const imageUri = result.assets[0].uri;
        
        // Try to extract location from camera EXIF
        let locationFound = false;
        let exifLocation = null;

        if (result.assets[0].exif) {
          const exif = result.assets[0].exif;
          console.log('Camera EXIF data:', exif);
          
          // Extract location using helper function
          exifLocation = extractLocationFromExif(exif);
          
          if (exifLocation) {
            locationFound = true;
            console.log('Location from camera EXIF:', exifLocation);
          }
        }

        // Set location if found
        if (locationFound && exifLocation) {
          setPendingImageLocation({
            latitude: exifLocation.latitude,
            longitude: exifLocation.longitude,
            dateTimeOriginal: exifLocation.dateTimeOriginal, // Include datetime
            source: 'exif',
          });
          
          const locationMsg = `Photo location:\n${exifLocation.latitude.toFixed(4)}, ${exifLocation.longitude.toFixed(4)}`;
          const dateMsg = exifLocation.dateTimeOriginal 
            ? `\n\nCaptured: ${exifLocation.dateTimeOriginal}` 
            : '';
          
          showCustomAlert(
            'Location Captured',
            locationMsg + dateMsg
          );
        } else {
          console.log('No valid location in camera EXIF, will use GPS');
          // Will use GPS fallback
          setPendingImageLocation(null);
        }
        
        // Open crop editor
        setPendingImage(imageUri);
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      showCustomAlert('Error', 'Failed to capture photo: ' + error.message);
    }
  };
  
  // NEW: crop complete
  const handleCropComplete = (croppedImageData) => {
    setIsEditing(false);
    setPendingImage(null);
    handleImageSelection(croppedImageData.uri); // continue pipeline
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
          <Text style={styles.welcome}>Welcome back, {farmerName}!</Text>
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
            onPress={() => navigation.navigate('Library')}
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

      {/* --- CROPPER --- */}
      {pendingImage && (
        <ImageEditor
          isVisible={isEditing}
          imageUri={pendingImage}
          onEditingComplete={handleCropComplete}
          onEditingCancel={() => {
            setPendingImage(null);
            setIsEditing(false);
          }}
          fixedAspectRatio={0}
          dynamicCrop={true}
        />
      )}

      {/* LOADING MODAL */}
      <Modal transparent={true} animationType="fade" visible={loading && !minimized}>
        <View style={styles.loadingOverlay}>
          <View style={styles.spinnerContainer}>
            <Image
              source={require('../assets/logo.png')} 
              resizeMode="contain"
              style={styles.onionGif}
            />
            <ActivityIndicator size="large" color="#7a1f6f"/>
            <Text style={styles.loadingText}>
              {loadingMessages[loadingStep]}
            </Text>

            <TouchableOpacity
              style={styles.minimizeButton}
              onPress={() => setMinimized(true)}
            >
              <Text style={styles.minimizeButtonText}>−</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Minimized Floating Status Bubble */}
      {loading && minimized && (
        <TouchableOpacity
          style={styles.minimizedBubble}
          onPress={() => setMinimized(false)}
          activeOpacity={0.8}
        >
          <Text style={styles.minimizedStepText}>
            {loadingMessages[loadingStep]}
          </Text>
          <Text style={styles.minimizedRestore}>+</Text>
        </TouchableOpacity>
      )}

      {/* Awesome Alert */}
      <AwesomeAlert
        show={showAlert}
        showProgress={false}
        title={alertTitle}
        message={alertMessage}
        closeOnTouchOutside={true}
        closeOnHardwareBackPress={true}
        showConfirmButton={true}
        confirmText="OK"
        confirmButtonColor="#7a1f6f"
        onConfirmPressed={() => {
          setShowAlert(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f2f7f5',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  welcome: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4a5a00',
    marginBottom: 1,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5a00',
  },
  main: {
    width: '100%',
    marginTop: 1,
    alignItems: 'center',
  },
  actionButton: {
    width: '100%',
    borderWidth: 0.5,
    borderColor: '#666',
    borderRadius: 10,
    backgroundColor: '#fff',
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
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
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
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
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 30,
    paddingHorizontal: 40,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 10,
    shadowRadius: 100,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  onionGif: {
    width: 160,
    height: 160,
    marginBottom: 20,
  },
  minimizeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ddd',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  minimizeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
  },
  minimizedBubble: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#7a1f6f',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    maxWidth: 260,
  },
  minimizedStepText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 12,
    flexShrink: 1,
  },
  minimizedRestore: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    width: 24,
    textAlign: 'center',
  },
});

export default OnionScanApp;