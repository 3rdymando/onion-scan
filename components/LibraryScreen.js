import React from 'react';
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
      <Text style={styles.libraryTitle}>ONION PESTS OFFLINE LIBRARY</Text>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor="#A0AEC0"
        />
        <TouchableOpacity>
          <Image
            source={{
              uri: 'https://img.icons8.com/ios-filled/50/000000/search--v1.png',
            }}
            style={styles.iconImage}
          />
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={DATA}
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
  logo: {
    width: 220,
    height: 48,
  },
  libraryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF2F7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 10,
    marginHorizontal: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2D3748',
  },
  iconImage: {
    width: 20,
    height: 20,
    tintColor: '#4A5568',
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
