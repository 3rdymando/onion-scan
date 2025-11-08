import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, SectionList, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { auth, db } from '../firebase.js';
import { query, where, collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import AwesomeAlert from 'react-native-awesome-alerts';
import NetInfo from '@react-native-community/netinfo';
import { Image } from 'expo-image'; // better caching and smoother loading

// ✅ Memoized scan item component
const ScanItem = React.memo(({ item, onDelete, onPress }) => (
  <View style={styles.itemContainer}>
    <TouchableOpacity style={styles.itemContent} onPress={onPress}>
      <Image
        source={{ uri: item.image }}
        style={styles.itemImage}
        cachePolicy="memory-disk"
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
          LOCATION:{' '}
          <Text style={{ fontWeight: 'normal' }}>
            {item.latitude ? item.latitude : 'N/A'},{' '}
            {item.longitude ? item.longitude : 'N/A'}
          </Text>
        </Text>
      </View>
    </TouchableOpacity>
    <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
      <FontAwesome name="trash" size={20} color="#ff4444" />
    </TouchableOpacity>
  </View>
));

export default function ScannedScreen({ navigation }) {
  const [scans, setScans] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertData, setAlertData] = useState({
    title: '',
    message: '',
    confirmText: 'OK',
    cancel: false,
    onConfirm: null,
  });

  // 🧠 Grouping logic (memoized)
  const groupScansByMonth = useCallback((scansList) => {
    const grouped = {};
    scansList.forEach((scan) => {
      const date = new Date(scan.date);
      const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!grouped[monthYear]) grouped[monthYear] = [];
      grouped[monthYear].push(scan);
    });

    return Object.keys(grouped)
      .sort((a, b) => new Date(b) - new Date(a))
      .map((title) => ({ title, data: grouped[title] }));
  }, []);

  // 🔥 Real-time listener (only updates once)
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(collection(db, 'pestScans'), where('userId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setScans(fetched);
    });

    return () => unsubscribe();
  }, []);

  // 🧮 Memoized filtering and grouping
  const filteredGroupedScans = useMemo(() => {
    const filtered = searchQuery
      ? scans.filter((scan) =>
          scan.result.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : scans;
    return groupScansByMonth(filtered);
  }, [scans, searchQuery, groupScansByMonth]);

  // 🔁 Debounced search handler
  const handleSearchChange = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  // 🧹 Delete one scan
  const deleteScan = useCallback(async (id) => {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      showAlertBox('No Internet Connection', 'You need an internet connection to delete scans.');
      return;
    }
    try {
      await deleteDoc(doc(db, 'pestScans', id));
      showAlertBox('Success', 'Scan deleted.');
    } catch (error) {
      console.error(error);
      showAlertBox('Error', `Failed to delete scan: ${error.message}`);
    }
  }, []);

  // 🧩 Confirm delete one
  const confirmDelete = useCallback((id) => {
    showAlertBox('Delete Scan', 'Are you sure you want to delete this scan?', {
      confirmText: 'Delete',
      cancel: true,
      onConfirm: () => deleteScan(id),
    });
  }, [deleteScan]);

  // 🧹 Clear all scans (faster using Promise.all)
  const clearAllScans = useCallback(async () => {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      showAlertBox('No Internet Connection', 'You need an internet connection to clear scans.');
      return;
    }

    showAlertBox('Clear All Scans', 'Are you sure you want to delete all scans?', {
      confirmText: 'Delete All',
      cancel: true,
      onConfirm: async () => {
        try {
          await Promise.all(scans.map((scan) => deleteDoc(doc(db, 'pestScans', scan.id))));
          showAlertBox('Success', 'All scans cleared.');
        } catch (error) {
          console.error(error);
          showAlertBox('Error', `Failed to clear scans: ${error.message}`);
        }
      },
    });
  }, [scans]);

  // ⚡ Reusable alert function
  const showAlertBox = (title, message, options = {}) => {
    setAlertData({
      title,
      message,
      confirmText: options.confirmText || 'OK',
      cancel: !!options.cancel,
      onConfirm: options.onConfirm || null,
    });
    setShowAlert(true);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require('../assets/onionscan.png')}
          style={styles.logo}
          contentFit="contain"
        />
      </View>

      <Text style={styles.title}>SCANNED PEST HISTORY</Text>

      <View style={styles.searchAndClearContainer}>
        <View style={styles.searchContainer}>
          <FontAwesome name="bars" size={20} color="gray" style={{ marginRight: 10 }} />
          <TextInput
            placeholder="Search"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={handleSearchChange}
          />
          <FontAwesome name="search" size={20} color="gray" style={{ marginLeft: 10 }} />
        </View>

        {scans.length > 0 && (
          <TouchableOpacity style={styles.clearAllButton} onPress={clearAllScans}>
            <Text style={styles.clearAllButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 🚀 Optimized SectionList */}
      <SectionList
        sections={filteredGroupedScans}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ScanItem
            item={item}
            onDelete={() => confirmDelete(item.id)}
            onPress={() => navigation.navigate('ResultScreen', { item: item.id })}
          />
        )}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={<Text style={styles.emptyText}>No scanned pests found.</Text>}
        initialNumToRender={10}
        windowSize={5}
        removeClippedSubviews
      />

      {/* Alert */}
      <AwesomeAlert
        show={showAlert}
        title={alertData.title}
        message={alertData.message}
        showConfirmButton
        confirmText={alertData.confirmText}
        confirmButtonColor="#7a1f6f"
        showCancelButton={alertData.cancel}
        cancelButtonColor="#999"
        onCancelPressed={() => setShowAlert(false)}
        onConfirmPressed={() => {
          setShowAlert(false);
          if (alertData.onConfirm) {
            setTimeout(() => alertData.onConfirm(), 300);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f7f5', paddingHorizontal: 12, paddingTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 6 },
  logo: { width: 365, height: 80 },
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
  searchInput: { flex: 1, fontSize: 15, color: '#2f3e46' },
  clearAllButton: {
    backgroundColor: '#ee33b7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
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
  itemContent: { flex: 1, flexDirection: 'row', alignItems: 'flex-start' },
  itemImage: { width: 60, height: 60, borderRadius: 6, marginRight: 8, marginTop: 5 },
  resultText: { fontWeight: 'bold', fontSize: 14, marginBottom: 2, color: '#333' },
  detailText: { fontSize: 12, fontWeight: '600', color: '#555' },
  deleteButton: { padding: 10 },
  emptyText: { textAlign: 'center', color: '#555', fontSize: 16, marginTop: 20 },
});
