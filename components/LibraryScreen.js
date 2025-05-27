import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons'; // make sure you have this installed

const DATA = [
  {
    id: '1',
    title: 'Armyworm',
    order: 'Lepidoptera',
    family: 'Noctuidae',
    species: 'Mythimna unipuncta',
    filipinoNames: 'N/A',
    stagesOfDevelopment: 'Egg, Larva, Pupa, Adult',
    damageCharacteristics: 'Chews leaves, causing irregular holes; can defoliate crops.',
    treatmentRecommendations: 'Use Bacillus thuringiensis (Bt) or chemical insecticides; remove crop debris.',
    image:
      'https://www.cabidigitallibrary.org/cms/10.1079/cabicompendium.29809/asset/75a46b5e-469f-4dbf-afe3-1d9cf12f5ce4/assets/graphic/laphex03.jpeg'
  },
  {
    id: '2',
    title: 'Cutworm',
    order: 'Lepidoptera',
    family: 'Noctuidae',
    species: 'Agrotis spp.',
    filipinoNames: 'N/A',
    stagesOfDevelopment: 'Egg, Larva, Pupa, Adult',
    damageCharacteristics: 'Cuts stems at soil level; feeds on roots and leaves.',
    treatmentRecommendations: 'Use collars around seedlings; apply insecticides at dusk.',
    image:
      'https://extension.umn.edu/sites/extension.umn.edu/files/glassy-cutworm.jpg',
  },
  {
    id: '3',
    title: 'Red Spider Mites',
    order: 'Acari',
    family: 'Tetranychidae',
    species: 'Tetranychus urticae',
    filipinoNames: 'N/A',
    stagesOfDevelopment: 'Egg, Larva, Nymph, Adult',
    damageCharacteristics: 'Sucks sap, causing stippling, yellowing, and webbing on leaves.',
    treatmentRecommendations: 'Use miticides; increase humidity; introduce predatory mites.',
    image:
      'https://www.ignitionseeds.co.nz/cdn/shop/files/red_spider_mite_main.webp?v=1681245160&width=1500',
  },
];

const Item = ({ item, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.item}>
    <Image source={{ uri: item.image }} style={styles.image} />
    <View style={styles.infoContainer}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.species}>{item.species}</Text>
      <Text style={styles.detail}>Order: {item.order}</Text>
      <Text style={styles.detail}>Family: {item.family}</Text>
    </View>
  </TouchableOpacity>
);

const LibraryScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState(DATA);

  const handleSearch = (text) => {
    setSearchQuery(text);
    const newData = DATA.filter(item =>
      item.title.toLowerCase().includes(text.toLowerCase()) ||
      item.species.toLowerCase().includes(text.toLowerCase()) ||
      item.order.toLowerCase().includes(text.toLowerCase()) ||
      item.family.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredData(newData);
  };

  const handlePress = (item) => {
    navigation.navigate('ResultScreen', { item });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ONIONSCAN Logo (Top Center) */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/onionscan.png')}
          style={styles.logoCentered}
          resizeMode="contain"
        />
      </View>

      {/* Title */}
      <View style={styles.header}></View>
      <Text style={styles.libraryTitle}>ONION PESTS OFFLINE LIBRARY</Text>

      {/* Search Bar */}
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
            placeholderTextColor="#A0AEC0"
          />
          <TouchableOpacity>
            <FontAwesome name="search" size={20} color="gray" style={{ marginLeft: 10 }} />
          </TouchableOpacity>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filteredData}
        renderItem={({ item }) => (
          <Item item={item} onPress={() => handlePress(item)} />
        )}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 0,
  },
  libraryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
    header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 6,
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
    marginHorizontal: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#2D3748',
  },
  item: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 10,
    marginBottom: 10,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    marginHorizontal: 4,
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  infoContainer: {
    flex: 1,
    paddingLeft: 10,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  species: {
    fontSize: 13,
    color: '#4A5568',
  },
  detail: {
    fontSize: 12,
    color: '#718096',
  },
  logoCentered: {
    width: 370,
    height: 80,
    marginTop: 40,
  },
});

export default LibraryScreen;