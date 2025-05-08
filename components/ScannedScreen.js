import React, { useState, useEffect } from 'react';
import { View, Text, SectionList, Image, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

export default function ScannedScreen({ navigation }) {
  const [scans, setScans] = useState([]);
  const [filteredScans, setFilteredScans] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Function to load scans from AsyncStorage
  const loadScans = async () => {
    try {
      const savedScans = await AsyncStorage.getItem('scannedPests');
      console.log('Raw saved scans from AsyncStorage:', savedScans);

      const parsedScans = savedScans ? JSON.parse(savedScans) : [];
      console.log('Parsed scans:', parsedScans);

      setScans(parsedScans);
      setFilteredScans(groupScansByMonth(parsedScans));
    } catch (error) {
      console.error('Error loading scans from AsyncStorage:', error);
      Alert.alert('Storage Error', 'Failed to load scans: ' + error.message);
    }
  };

  // Load scans when the screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadScans();
    }, [])
  );

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

  // Delete a single scan
  const deleteScan = async (id) => {
    try {
      const savedScans = await AsyncStorage.getItem('scannedPests');
      const scans = savedScans ? JSON.parse(savedScans) : [];
      const updatedScans = scans.filter((scan) => scan.id !== id);
      await AsyncStorage.setItem('scannedPests', JSON.stringify(updatedScans));
      setScans(updatedScans);
      setFilteredScans(groupScansByMonth(updatedScans));
      Alert.alert('Success', 'Scan deleted.');
    } catch (error) {
      console.error('Error deleting scan:', error);
      Alert.alert('Error', 'Failed to delete scan: ' + error.message);
    }
  };

  // Clear all scans
  const clearAllScans = async () => {
    Alert.alert(
      'Clear All Scans',
      'Are you sure you want to delete all scanned pest history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('scannedPests');
              setScans([]);
              setFilteredScans([]);
              Alert.alert('Success', 'All scans cleared.');
            } catch (error) {
              console.error('Error clearing all scans:', error);
              Alert.alert('Error', 'Failed to clear scans: ' + error.message);
            }
          },
        },
      ]
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

      {/* Title */}
      <Text style={styles.title}>SCANNED PEST HISTORY</Text>

      {/* Search Bar and Clear All Button */}
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

      {/* SectionList grouped by month */}
      <SectionList
        sections={filteredScans}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          console.log('Rendering scan item:', item);
          return (
            <View style={styles.itemContainer}>
              <TouchableOpacity
                style={styles.itemContent}
                onPress={() => navigation.navigate('ResultScreen', { item: item.details })}
              >
                <Image
                  source={{ uri: item.image }}
                  style={styles.itemImage}
                  onError={(e) => console.log('Image loading error:', e.nativeEvent.error)}
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
                      {item.latitude ? item.latitude.toFixed(6) : 'N/A'},{' '}
                      {item.longitude ? item.longitude.toFixed(6) : 'N/A'}
                    </Text>
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => {
                  Alert.alert(
                    'Delete Scan',
                    'Are you sure you want to delete this scan?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => deleteScan(item.id),
                      },
                    ]
                  );
                }}
              >
                <FontAwesome name="trash" size={20} color="#ff4444" />
              </TouchableOpacity>
            </View>
          );
        }}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={<Text style={styles.emptyText}>No scanned pests found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 6,
  },
  logo: {
    width: 365,
    height: 80,
    resizeMode: 'contain',
  },
  headerText: {
    marginLeft: 10,
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'Montserrat',
  },
  title: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 12,
    fontFamily: 'Montserrat',
    color: '#555',
  },
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
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  clearAllButton: {
    backgroundColor: '#ee33b7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  clearAllButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
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
    marginBottom: 10,
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
    marginRight: 10,
  },
  resultText: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
    color: '#333',
  },
  detailText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
  },
  deleteButton: {
    padding: 10,
  },
  emptyText: {
    textAlign: 'center',
    color: '#555',
    fontSize: 16,
    marginTop: 20,
  },
});