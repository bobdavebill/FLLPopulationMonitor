// Replace the values below with your Firebase Web App configuration.
// Firebase Console -> Project settings -> Your apps -> Web app.
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC3Lzl64LhNAMOLsI19hAbY1NZiPbbs0ck",
  authDomain: "fllpopulationmonitor.firebaseapp.com",
  projectId: "fllpopulationmonitor",
  storageBucket: "fllpopulationmonitor.firebasestorage.app",
  messagingSenderId: "1045132721456",
  appId: "1:1045132721456:web:be032824b4e2ad76729cf5",
  measurementId: "G-F4K78THLBG"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
