import React, { useState, useEffect } from 'react';
import { View, Text, SectionList, Image, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { auth, db } from '../firebase.js';
import { query, where, collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import AwesomeAlert from 'react-native-awesome-alerts';
import NetInfo from '@react-native-community/netinfo'; // Added for connectivity check

export default function ScannedScreen({ navigation }) {
  const [scans, setScans] = useState([]);
  const [filteredScans, setFilteredScans] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Alert state
  const [showAlert, setShowAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [showConfirmButton, setShowConfirmButton] = useState(true);
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

  // Group scans by month
  const groupScansByMonth = (scans) => {
    const grouped = {};
    scans.forEach((scan) => {
      const date = new Date(scan.date);
      const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }
      grouped[monthYear].push(scan);
    });

    return Object.keys(grouped)
      .sort((a, b) => new Date(b) - new Date(a))
      .map((title) => ({
        title,
        data: grouped[title],
      }));
  };

  // Real-time Firestore listener
  useEffect(() => {
    if (!auth.currentUser) {
      console.log('User not logged in');
      return;
    }

    const q = query(
      collection(db, 'pestScans'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(docSnap => ({
        id: docSnap.data().id,
        ...docSnap.data(),
      }));

      setScans(fetched);
      setFilteredScans(groupScansByMonth(fetched));
    });

    return () => unsubscribe();
  }, []);

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query) {
      setFilteredScans(groupScansByMonth(scans));
      return;
    }

    const filtered = scans.filter((scan) =>
      scan.result.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredScans(groupScansByMonth(filtered));
  };

  // Delete a single scan with internet check
  const deleteScan = async (id) => {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      showCustomAlert(
        'No Internet Connection',
        'You need an internet connection to delete scans.'
      );
      return;
    }

    try {
      await deleteDoc(doc(db, 'pestScans', id));
      showCustomAlert('Success', 'Scan deleted.');
    } catch (error) {
      console.error('Error deleting scan:', error);
      showCustomAlert('Error', 'Failed to delete scan: ' + error.message);
    }
  };

  // Confirm delete for single scan
  const confirmDelete = (id) => {
    showCustomAlert(
      'Delete Scan',
      'Are you sure you want to delete this scan?',
      {
        confirmText: 'Delete',
        cancel: true,
        onConfirm: () => deleteScan(id)
      }
    );
  };

  // Clear all scans with internet check
  const clearAllScans = async () => {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      showCustomAlert(
        'No Internet Connection',
        'You need an internet connection to clear scans.'
      );
      return;
    }

    showCustomAlert(
      'Clear All Scans',
      'Are you sure you want to delete all scanned pest history?',
      {
        confirmText: 'Delete',
        cancel: true,
        onConfirm: async () => {
          try {
            for (const scan of scans) {
              await deleteDoc(doc(db, 'pestScans', scan.id));
            }
            showCustomAlert('Success', 'All scans cleared.');
          } catch (error) {
            console.error('Error clearing all scans:', error);
            showCustomAlert('Error', 'Failed to clear scans: ' + error.message);
          }
        }
      }
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require('../assets/onionscan.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.title}>SCANNED PEST HISTORY</Text>

      <View style={styles.searchAndClearContainer}>
        <View style={styles.searchContainer}>
          <TouchableOpacity>
            <FontAwesome name="bars" size={20} color="gray" style={{ marginRight: 10 }} />
          </TouchableOpacity>
          <TextInput
            placeholder="Search"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          <TouchableOpacity>
            <FontAwesome name="search" size={20} color="gray" style={{ marginLeft: 10 }} />
          </TouchableOpacity>
        </View>
        {scans.length > 0 && (
          <TouchableOpacity style={styles.clearAllButton} onPress={clearAllScans}>
            <Text style={styles.clearAllButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      <SectionList
        sections={filteredScans}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <TouchableOpacity
              style={styles.itemContent}
              onPress={() => navigation.navigate('ResultScreen', { item: item.id })}
            >
              <Image
                source={{ uri: item.image }}
                style={styles.itemImage}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.resultText}>
                  RESULT: <Text style={{ color: '#3a5a00' }}>{item.result}</Text>
                </Text>
                <Text style={styles.detailText}>
                  DATE: <Text style={{ fontWeight: 'normal' }}>{item.date}</Text>
                </Text>
                <Text style={styles.detailText}>
                  TIME: <Text style={{ fontWeight: 'normal' }}>{item.time}</Text>
                </Text>
                <Text style={styles.detailText}>
                  LOCATION: <Text style={{ fontWeight: 'normal' }}>
                    {item.latitude ? item.latitude : 'N/A'},{' '}
                    {item.longitude ? item.longitude : 'N/A'}
                  </Text>
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => confirmDelete(item.id)}
            >
              <FontAwesome name="trash" size={20} color="#ff4444" />
            </TouchableOpacity>
          </View>
        )}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={<Text style={styles.emptyText}>No scanned pests found.</Text>}
      />

      {/* Awesome Alert */}
      <AwesomeAlert
        show={showAlert}
        showProgress={false}
        title={alertTitle}
        message={alertMessage}
        closeOnTouchOutside={false}
        closeOnHardwareBackPress={false}
        showConfirmButton={showConfirmButton}
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
  container: { flex: 1, backgroundColor: '#f2f7f5', paddingHorizontal: 12, paddingTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 6 },
  logo: { width: 365, height: 80, resizeMode: 'contain' },
  title: { textAlign: 'center', fontSize: 18, fontWeight: 'bold', marginVertical: 12 },
  searchAndClearContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 25,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#2f3e46',
  },
  clearAllButton: { backgroundColor: '#ee33b7', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, 
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5, },
  clearAllButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  sectionHeader: { fontSize: 14, fontWeight: 'bold', color: '#6b2e5c', marginTop: 12, marginBottom: 6, textTransform: 'uppercase' },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 10,
    marginBottom: 7,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  itemImage: { width: 60, height: 60, borderRadius: 6, marginRight: 8, marginTop: 5 },
  resultText: { fontWeight: 'bold', fontSize: 14, marginBottom: 2, color: '#333' },
  detailText: { fontSize: 12, fontWeight: '600', color: '#555' },
  deleteButton: { padding: 10 },
  emptyText: { textAlign: 'center', color: '#555', fontSize: 16, marginTop: 20 },
});
