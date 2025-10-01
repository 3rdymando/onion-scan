import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import AwesomeAlert from 'react-native-awesome-alerts';

export default function ResultScreen({ route, navigation }) {
  const { item } = route.params;
  const docId = typeof item === 'string' ? item : item.id;
  const [scanData, setScanData] = useState(null);
  const [loading, setLoading] = useState(true);
  const viewRef = useRef();

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

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'pestScans', docId), (docSnap) => {
      if (docSnap.exists()) {
        setScanData(docSnap.data());
      } else {
        showCustomAlert('Error', 'Scan data not found.', () => navigation.goBack());
      }
      setLoading(false);
    });

    return () => unsub();
  }, [docId]);

  const downloadScreenshot = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        showCustomAlert(
          'Permission Denied',
          'Permission to access media library is required!'
        );
        return;
      }

      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 1,
      });

      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('OnionScan', asset, false);

      showCustomAlert('Download Complete', 'Pest Report saved to gallery.');
    } catch (error) {
      console.error(error);
      showCustomAlert(
        'Download Failed',
        'An error occurred while saving the screenshot.'
      );
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#950E77" />
        <Text>Loading scan details...</Text>
      </View>
    );
  }

  if (!scanData) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>No data found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View ref={viewRef} collapsable={false} style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('../assets/onionscan.png')}
            style={styles.logo}
          />
        </View>

        {/* Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: scanData.image }}
            style={styles.resultImage}
          />
        </View>

        {/* Results */}
        <View style={styles.section}>
          <Text style={styles.resultText}>
            RESULT: <Text style={styles.resultHighlight}>{scanData.result}</Text>
          </Text>

          <Text style={styles.verificationText}>
            VERIFICATION STATUS:{' '}
            <Text
              style={[
                styles.verificationHighlight,
                scanData.verificationStatus === 'Verified'
                  ? { color: 'green' }
                  : scanData.verificationStatus === 'Rejected'
                  ? { color: 'red' }
                  : { color: 'orange' },
              ]}
            >
              {scanData.verificationStatus || 'Pending'}
            </Text>
          </Text>

          <View style={styles.detailBlock}>
            <Text style={styles.detailTitle}>COMMON NAME:</Text>
            <Text style={styles.detailText}>{scanData.result}</Text>
          </View>
          <View style={styles.detailBlock}>
            <Text style={styles.detailTitle}>ORDER & FAMILY:</Text>
            <Text style={styles.detailText}>
              {scanData.details?.order || 'N/A'}: {scanData.details?.family || 'N/A'}
            </Text>
          </View>
          <View style={styles.detailBlock}>
            <Text style={styles.detailTitle}>SCIENTIFIC NAME:</Text>
            <Text style={styles.detailText}>{scanData.details?.species || 'N/A'}</Text>
          </View>
          <View style={styles.detailBlock}>
            <Text style={styles.detailTitle}>DAMAGE & SYMPTOMS:</Text>
            {Array.isArray(scanData.details?.damageCharacteristics) ? (
              scanData.details.damageCharacteristics.map((line, index) => (
                <Text key={index} style={styles.detailText}>• {line}</Text>
              ))
            ) : (
              <Text style={styles.detailText}>
                {scanData.details?.damageCharacteristics || 'N/A'}
              </Text>
            )}
          </View>
          <View style={styles.detailBlock}>
            <Text style={styles.detailTitle}>TREATMENT & MANAGEMENT RECOMMENDATIONS:</Text>
            {Array.isArray(scanData.details?.treatmentRecommendations) ? (
              scanData.details.treatmentRecommendations.map((rec, index) => (
                <View key={index} style={{ marginTop: 4 }}>
                  {/* Category (main bullet) */}
                  <Text style={[styles.detailText, { fontWeight: 'bold' }]}>
                    {rec.category}:
                  </Text>
                  {/* Sub-bullets */}
                  {rec.methods.map((m, i) => (
                    <Text key={i} style={[styles.detailText, { marginLeft: 0 }]}>
                    • {m}
                    </Text>
                  ))}
                </View>
              ))
            ) : (
              <Text style={styles.detailText}>
                {scanData.details?.treatmentRecommendations || 'N/A'}
              </Text>
            )}
          </View>
          <View style={styles.detailBlock}>
            <Text style={styles.detailTitle}>ADDRESS:</Text>
            <Text style={styles.detailText}>{scanData.locationAddress || 'N/A'}</Text>
          </View>
          <View style={styles.detailBlock}>
            <Text style={styles.detailTitle}>LOCATION (LAT, LONG):</Text>
            <Text style={styles.detailText}>
              {scanData.latitude ? scanData.latitude : 'N/A'},{' '}
              {scanData.longitude ? scanData.longitude : 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity onPress={downloadScreenshot} style={styles.downloadButton}>
        <Text style={styles.downloadButtonText}>Download Pest Report Details</Text>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#ffffffff' },
  card: { borderWidth: 1, borderColor: '#950E77', padding: 10, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  logo: { width: 340, height: 60, resizeMode: 'contain' },
  imageContainer: { borderWidth: 2, borderColor: '#950E77', marginBottom: 10 },
  resultImage: { width: '100%', height: 200, resizeMode: 'cover' },
  section: { marginTop: 10 },
  resultText: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', color: '#111' },
  resultHighlight: { color: '#15803D' },
  detailBlock: { marginTop: 10 },
  detailTitle: { fontSize: 12, fontWeight: 'bold', color: '#4A5568' },
  detailText: { fontSize: 12, color: '#4A5568' },
  downloadButton: {
    marginTop: 20,
    backgroundColor: '#FF3BBF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  downloadButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  verificationText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
    color: '#111',
  },
  verificationHighlight: {
    fontWeight: 'bold',
  },
});
