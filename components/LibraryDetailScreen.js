import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import * as MediaLibrary from "expo-media-library";
import { captureRef } from "react-native-view-shot";
import AwesomeAlert from "react-native-awesome-alerts";

export default function LibraryDetailScreen({ route }) {
  const { item } = route.params;
  const viewRef = useRef();

  // --- ALERT STATE ---
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

  const downloadScreenshot = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        showCustomAlert(
          "Permission Denied",
          "Permission to access media library is required!"
        );
        return;
      }

      const uri = await captureRef(viewRef, {
        format: "png",
        quality: 1,
      });

      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync("OnionScan", asset, false);

      showCustomAlert("Download Complete", "Pest details saved to gallery.");
    } catch (error) {
      console.error(error);
      showCustomAlert(
        "Download Failed",
        "An error occurred while saving the screenshot."
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View ref={viewRef} collapsable={false} style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require("../assets/onionscan.png")}
            style={styles.logo}
          />
        </View>

        {/* Image */}
        <View style={styles.imageContainer}>
          <Image source={item.image} style={styles.resultImage} />
        </View>

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.resultText}>
            OFFLINE DATA:{" "}
            <Text style={styles.resultHighlight}>{item.title}</Text>
          </Text>

          <View style={styles.detailBlock}>
            <Text style={styles.detailTitle}>COMMON NAME:</Text>
            <Text style={styles.detailText}>{item.title}</Text>
          </View>

          <View style={styles.detailBlock}>
            <Text style={styles.detailTitle}>ORDER & FAMILY:</Text>
            <Text style={styles.detailText}>
              {item.order}: {item.family}
            </Text>
          </View>

          <View style={styles.detailBlock}>
            <Text style={styles.detailTitle}>SCIENTIFIC NAME:</Text>
            <Text style={styles.detailText}>{item.species}</Text>
          </View>

          <View style={styles.detailBlock}>
            <Text style={styles.detailTitle}>DAMAGE & SYMPTOMS:</Text>
            <Text style={styles.detailText}>{item.damageCharacteristics}</Text>
          </View>

          <View style={styles.detailBlock}>
            <Text style={styles.detailTitle}>TREATMENT & MANAGEMENT RECOMMENDATIONS:</Text>
            <Text style={styles.detailText}>
              {item.treatmentRecommendations}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        onPress={downloadScreenshot}
        style={styles.downloadButton}
      >
        <Text style={styles.downloadButtonText}>
          Download Pest Library Details
        </Text>
      </TouchableOpacity>

      {/* ALERT COMPONENT */}
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
  container: { padding: 16, backgroundColor: "#ffffffff" },
  card: {
    borderWidth: 1,
    borderColor: "#950E77",
    padding: 10,
    backgroundColor: "#fff",
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  logo: { width: 340, height: 60, resizeMode: "contain" },
  imageContainer: { borderWidth: 2, borderColor: "#950E77", marginBottom: 10 },
  resultImage: { width: "100%", height: 200, resizeMode: "cover" },
  section: { marginTop: 10 },
  resultText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    color: "#111",
  },
  resultHighlight: { color: "#15803D" },
  detailBlock: { marginTop: 10 },
  detailTitle: { fontSize: 12, fontWeight: "bold", color: "#4A5568" },
  detailText: { fontSize: 12, color: "#4A5568" },
  downloadButton: {
    marginTop: 20,
    backgroundColor: "#FF3BBF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  downloadButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
});
