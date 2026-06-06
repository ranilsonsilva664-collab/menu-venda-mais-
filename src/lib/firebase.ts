import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBc22UQKaU8lVYS1rnAl0e5TXquRmvPNwM",
  authDomain: "sas-5c58c.firebaseapp.com",
  projectId: "sas-5c58c",
  storageBucket: "sas-5c58c.firebasestorage.app",
  messagingSenderId: "912693677734",
  appId: "1:912693677734:web:698dfb145a86063939ee67",
  measurementId: "G-R1SE4DPGQN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);
