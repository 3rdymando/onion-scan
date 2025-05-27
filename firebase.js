// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCPHvAwhe5ubW6YXgcFg8eibcau-PttoPU",
  authDomain: "onionmap-4943d.firebaseapp.com",
  projectId: "onionmap-4943d",
  storageBucket: "onionmap-4943d.firebasestorage.app",
  messagingSenderId: "754418655412",
  appId: "1:754418655412:web:3cbcf30e747d88ec4537e1",
  measurementId: "G-B8WQTDD133"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export { db, storage, auth };