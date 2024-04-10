import { initializeApp } from 'firebase/app';
import firebase from "firebase/compat/app";
import "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import { collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAmEBokBuN-pDnnuiRqzskl8tSXJfGfTcY",
    authDomain: "ibrahim-xurf.firebaseapp.com",
    projectId: "ibrahim-xurf",
    storageBucket: "ibrahim-xurf.appspot.com", 
    messagingSenderId: "968440264219",
    appId: "1:968440264219:web:d3f36ab6f9c946fd292abe"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

try {
      const docRef = await addDoc(collection(db, "users"), {
        first: "Ada",
        last: "Lovelace",
        born: 1815
      });
      console.log("Document written with ID: ", docRef.id);
    } catch (e) {
      console.error("Error adding document: ", e);
    }