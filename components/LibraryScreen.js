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
    title: 'Onion Armyworm',
    order: 'Lepidoptera',
    family: 'Noctuidae',
    species: 'Spodoptera exigua',
    filipinoNames: 'N/A',
    stagesOfDevelopment: 'Egg, Larva, Pupa, Adult',
    damageCharacteristics: 'Chews leaves, causing irregular holes; can defoliate crops.',
    treatmentRecommendations: 'Use Bacillus thuringiensis (Bt) or chemical insecticides; remove crop debris.',
    image:
      require('../assets/onion_armyworm.jpg'),
  },
  {
    id: '2',
    title: 'Fall Armyworm',
    order: 'Lepidoptera',
    family: 'Noctuidae',
    species: 'Spodoptera frugiperda',
    filipinoNames: 'N/A',
    stagesOfDevelopment: 'Egg, Larva, Pupa, Adult',
    damageCharacteristics: 'Cuts stems at soil level; feeds on roots and leaves.',
    treatmentRecommendations: 'Use collars around seedlings; apply insecticides at dusk.',
    image:
      require('../assets/fall_armyworm.jpg'),
  },
  {
    id: '3',
    title: 'Cutworm',
    order: 'Lepidoptera',
    family: 'Noctuidae',
    species: 'Spodoptera litura',
    filipinoNames: 'N/A',
    stagesOfDevelopment: 'Egg, Larva, Nymph, Adult',
    damageCharacteristics: 'Sucks sap, causing stippling, yellowing, and webbing on leaves.',
    treatmentRecommendations: 'Use miticides; increase humidity; introduce predatory mites.',
    image:
      require('../assets/cutworm.jpg'),
  },
  {
    id: '4',
    title: 'Thrips',
    order: 'Thysanoptera',
    family: 'Thripidae',
    species: 'Thrips tabaci',
    filipinoNames: 'Trips',
    stagesOfDevelopment: 'Egg, Nymph, Adult',
    damageCharacteristics: 'Scrapes leaf surfaces and sucks sap, causing silvery streaks and curling; reduces bulb size.',
    treatmentRecommendations: 'Use reflective mulches, apply insecticidal soap or neem oil, and avoid excessive nitrogen fertilizer.',
    image:
      require('../assets/thrips.jpg'),
  },
  {
    id: '5',
    title: 'Maggot',
    order: 'Diptera',
    family: 'Anthomyiidae',
    species: 'Delia antiqua',
    filipinoNames: 'N/A',
    stagesOfDevelopment: 'Egg, Larva, Pupa, Adult',
    damageCharacteristics: 'Larvae tunnel into bulbs and roots, causing wilting and rotting of plants.',
    treatmentRecommendations: 'Practice crop rotation; remove infested bulbs; use row covers and soil insecticides.',
    image:
      require('../assets/maggots.jpg'),
  },
  {
    id: '6',
    title: 'Leaf Miner',
    order: 'Diptera',
    family: 'Agromyzidae',
    species: 'Liriomyza spp.',
    filipinoNames: 'Mina-mina',
    stagesOfDevelopment: 'Egg, Larva, Pupa, Adult',
    damageCharacteristics: 'Larvae create serpentine mines in leaves, reducing photosynthesis and plant vigor.',
    treatmentRecommendations: 'Remove mined leaves; use yellow sticky traps; introduce parasitoid wasps; apply selective insecticides if needed.',
    image:
      require('../assets/leafminer.png'),
  },
  {
    id: '7',
    title: 'Aphids',
    order: 'Hemiptera',
    family: 'Aphididae',
    species: 'Aphis fabae / Myzus persicae',
    filipinoNames: 'Dapdap / Lumot',
    stagesOfDevelopment: 'Egg, Nymph, Adult',
    damageCharacteristics: 'Suck plant sap, causing curling, yellowing, and stunted growth; can transmit viral diseases.',
    treatmentRecommendations: 'Spray with insecticidal soap or neem oil; encourage natural predators like lady beetles; avoid excessive nitrogen fertilizer.',
    image:
      require('../assets/aphids.jpg'),
  },
];

const Item = ({ item, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.item}>
    <Image source={item.image} style={styles.image} />
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
    navigation.navigate('LibraryDetailScreen', { item });
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
    backgroundColor: '#f2f7f5',
    paddingHorizontal: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 0,
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