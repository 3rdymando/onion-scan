import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Your screen imports here
import FrontPage2 from './components/FrontPage.js';
import LoginScreen from './components/LoginScreen.js';
import SignupScreen from './components/SignupScreen.js';
import ForgotPasswordScreen from './components/ForgotPasswordScreen.js';
import OnionScanApp from './components/DashboardScreen.js';
import LibraryScreen from './components/LibraryScreen.js';
import ResultScreen from './components/ResultScreen.js';
import ScannedScreen from './components/ScannedScreen.js';
import ProfileScreen from './components/ProfileScreen.js';
import LibraryDetailScreen from './components/LibraryDetailScreen.js'

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function DashboardTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = 'home-outline';
          else if (route.name === 'Library') iconName = 'book-outline';
          else if (route.name === 'Scanned') iconName = 'image-outline';
          else if (route.name === 'Profile') iconName = 'person-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4A0D67',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          height: 60,
          paddingBottom: 5,
          backgroundColor: '#fff',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 5,
        },
      })}
    >
      <Tab.Screen name="Home" component={OnionScanApp} options={{ headerShown: false }} />
      <Tab.Screen name="Library" component={LibraryScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Scanned" component={ScannedScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isConnected, setIsConnected] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const popupOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected && state.isInternetReachable !== false;

      if (connected !== isConnected) {
        setIsConnected(connected);

        if (!connected) {
          // Show popup only when losing connection
          setShowPopup(true);
          Animated.timing(popupOpacity, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }).start();

          setTimeout(() => {
            Animated.timing(popupOpacity, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }).start(() => setShowPopup(false));
          }, 8000);
        }
        // If connected, do NOT show popup
      }
    });

    return () => unsubscribe();
  }, [isConnected, popupOpacity]);

  return (
    <>
      {/* Status Bar */}
      <View style={[styles.statusBar, { backgroundColor: isConnected ? 'green' : 'red' }]} />

      {/* Popup only shows when disconnected */}
      {showPopup && (
        <Animated.View style={[styles.popup, { opacity: popupOpacity }]}>
          <Text style={styles.popupText}>No internet connection!</Text>
        </Animated.View>
      )}

      {/* Navigation */}
      <NavigationContainer>
        <Stack.Navigator initialRouteName="FrontPage">
          <Stack.Screen name="FrontPage" component={FrontPage2} options={{ headerShown: false }} />
          <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Login' }} />
          <Stack.Screen name="Signup" component={SignupScreen} options={{ title: 'Sign Up' }} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Forgot Password' }} />
          <Stack.Screen name="Dashboard" component={DashboardTabNavigator} options={{ headerShown: false }} />
          <Stack.Screen name="ResultScreen" component={ResultScreen} options={{ title: 'Pest Details' }} />
          <Stack.Screen name="LibraryDetailScreen" component={LibraryDetailScreen} options={{ title: 'Library Details' }}/>
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

const styles = StyleSheet.create({
  statusBar: {
    height: 30,
    width: '100%',
    zIndex: 999,
  },
  popup: {
    position: 'absolute',
    top: 40,
    width: '100%',
    padding: 5,
    backgroundColor: '#cc000033',
    alignItems: 'center',
    zIndex: 999,
  },
  popupText: {
    color: '#cc0000',
    fontWeight: 'bold',
  },
});