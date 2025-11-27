import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, SectionList, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { auth, db } from '../firebase.js';
import { query, where, collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import AwesomeAlert from 'react-native-awesome-alerts';
import NetInfo from '@react-native-community/netinfo';
import { Image } from 'expo-image';

// Month dropdown box item
const MonthItem = ({ label, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.monthItem}>
    <Text style={styles.monthItemText}>{label}</Text>
  </TouchableOpacity>
);

// Memo scan item
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
            {item.latitude ? item.latitude : 'N/A'}, {item.longitude ? item.longitude : 'N/A'}
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
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);

  const [showAlert, setShowAlert] = useState(false);
  const [alertData, setAlertData] = useState({
    title: '',
    message: '',
    confirmText: 'OK',
    cancel: false,
    onConfirm: null,
  });

  // Group scans by month
const groupScansByMonth = useCallback((scansList) => {
  const grouped = {};

  scansList.forEach((scan) => {
    const d = new Date(scan.date); // "2025-09-30"
    const key = d.toLocaleString('default', { month: 'long', year: 'numeric' });

    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(scan);
  });

  // Sort scans inside each month (newest first)
  Object.keys(grouped).forEach((key) => {
    grouped[key].sort((a, b) => {
      const aDateTime = new Date(`${a.date}T${a.time}`);
      const bDateTime = new Date(`${b.date}T${b.time}`);
      return bDateTime - aDateTime;
    });
  });

  // Sort month sections correctly by numeric year + month
  return Object.keys(grouped)
    .sort((a, b) => {
      const aScan = grouped[a][0];
      const bScan = grouped[b][0];

      const aDate = new Date(`${aScan.date}T${aScan.time}`);
      const bDate = new Date(`${bScan.date}T${bScan.time}`);

      return bDate - aDate; // newest month first
    })
    .map((title) => ({ title, data: grouped[title] }));
}, []);


  // Real-time listener
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

  // Extract all months for dropdown
  const monthOptions = useMemo(() => {
    const set = new Set();
    scans.forEach((scan) => {
      const d = new Date(scan.date);
      const key = d.toLocaleString('default', { month: 'long', year: 'numeric' });
      set.add(key);
    });

    return ['All', ...Array.from(set).sort((a, b) => new Date(b) - new Date(a))];
  }, [scans]);

  // Filter + group scans
  const filteredGroupedScans = useMemo(() => {
    let list = [...scans];

    // Apply search
    if (searchQuery) {
      list = list.filter((scan) =>
        scan.result.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply month filter
    if (selectedMonth !== 'All') {
      list = list.filter((scan) => {
        const d = new Date(scan.date);
        const key = d.toLocaleString('default', { month: 'long', year: 'numeric' });
        return key === selectedMonth;
      });
    }

    return groupScansByMonth(list);
  }, [scans, searchQuery, selectedMonth, groupScansByMonth]);

    const handleSearchChange = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  // Delete one scan
  const deleteScan = useCallback(async (id) => {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      showAlertBox('No Internet Connection', 'You need internet to delete scans.');
      return;
    }
    try {
      await deleteDoc(doc(db, 'pestScans', id));
      showAlertBox('Success', 'Scan deleted.');
    } catch (error) {
      showAlertBox('Error', error.message);
    }
  }, []);

  const confirmDelete = useCallback((id) => {
    showAlertBox('Delete Scan', 'Are you sure you want to delete this scan?', {
      confirmText: 'Delete',
      cancel: true,
      onConfirm: () => deleteScan(id),
    });
  }, [deleteScan]);

  const clearAllScans = useCallback(async () => {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      showAlertBox('No Internet Connection', 'You need internet to clear scans.');
      return;
    }

    showAlertBox('Clear All Scans', 'Delete ALL scans?', {
      confirmText: 'Delete All',
      cancel: true,
      onConfirm: async () => {
        try {
          await Promise.all(scans.map((scan) => deleteDoc(doc(db, 'pestScans', scan.id))));
          showAlertBox('Success', 'All scans deleted.');
        } catch (error) {
          showAlertBox('Error', error.message);
        }
      },
    });
  }, [scans]);

  const showAlertBox = (title, message, options = {}) => {
    setAlertData({
      title,
      message,
      confirmText: options.confirmText || 'OK',
      cancel: options.cancel || false,
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

      {/* Search + Filter + Clear Button */}
      <View style={styles.searchAndClearContainer}>
        <View style={styles.searchContainer}>
          {/* Month Filter Button */}
          <TouchableOpacity
            onPress={() => setShowMonthDropdown(!showMonthDropdown)}
            style={{ paddingRight: 10 }}
          >
            <FontAwesome name="bars" size={20} color="gray" />
          </TouchableOpacity>

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

      {/* Dropdown */}
      {showMonthDropdown && (
        <View style={styles.dropdown}>
          {monthOptions.map((label) => (
            <MonthItem
              key={label}
              label={label}
              onPress={() => {
                setSelectedMonth(label);
                setShowMonthDropdown(false);
              }}
            />
          ))}
        </View>
      )}

      {/* List */}
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
        ListEmptyComponent={<Text style={styles.emptyText}>No scanned pests found.</Text>}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* Alerts */}
      <AwesomeAlert
        show={showAlert}
        title={alertData.title}
        message={alertData.message}
        confirmText={alertData.confirmText}
        showConfirmButton
        confirmButtonColor="#7a1f6f"
        showCancelButton={alertData.cancel}
        cancelButtonColor="#999"
        onCancelPressed={() => setShowAlert(false)}
        onConfirmPressed={() => {
          setShowAlert(false);
          if (alertData.onConfirm) setTimeout(alertData.onConfirm, 250);
        }}
      />
    </View>
  );
}

/* -------------------- STYLES -------------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f7f5', paddingHorizontal: 12, paddingTop: 40 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 6,
  },

  logo: { width: 365, height: 80 },

  title: { textAlign: 'center', fontSize: 18, fontWeight: 'bold', marginVertical: 12 },

  searchAndClearContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

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
  },

  searchInput: { flex: 1, fontSize: 15, color: '#2f3e46' },

  clearAllButton: {
    backgroundColor: '#ee33b7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    elevation: 5,
  },
  clearAllButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  /* DROPDOWN */
  dropdown: {
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 10,
    elevation: 4,
    marginBottom: 10,
  },

  monthItem: {
    paddingVertical: 8,
    paddingHorizontal: 5,
  },

  monthItemText: {
    fontSize: 15,
    color: '#333',
  },

  sectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6b2e5c',
    marginTop: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
  },

  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 10,
    marginBottom: 7,
    elevation: 2,
  },

  itemContent: { flex: 1, flexDirection: 'row', alignItems: 'flex-start' },

  itemImage: { width: 60, height: 60, borderRadius: 6, marginRight: 8, marginTop: 5 },

  resultText: { fontWeight: 'bold', fontSize: 14, marginBottom: 2, color: '#333' },

  detailText: { fontSize: 12, fontWeight: '600', color: '#555' },

  deleteButton: { padding: 10 },

  emptyText: { textAlign: 'center', color: '#555', fontSize: 16, marginTop: 20 },
});
