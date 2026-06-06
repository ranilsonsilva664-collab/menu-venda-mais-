import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBc22UQKaU8lVYS1rnAl0e5TXquRmvPNwM",
  authDomain: "sas-5c58c.firebaseapp.com",
  projectId: "sas-5c58c",
  storageBucket: "sas-5c58c.firebasestorage.app",
  messagingSenderId: "912693677734",
  appId: "1:912693677734:web:698dfb145a86063939ee67",
  measurementId: "G-R1SE4DPGQN"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  try {
    const testDoc = doc(db, "restaurants", "test-connection");
    await setDoc(testDoc, { success: true });
    console.log("SUCCESS");
    process.exit(0);
  } catch (error) {
    console.error("ERROR:", error.message);
    process.exit(1);
  }
}

test();
