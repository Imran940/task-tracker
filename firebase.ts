// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { GoogleAuthProvider, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDrCWEQOkFFbb6A3WWxxA6gw-kt1U0QAW0",
  authDomain: "task-management-b680b.firebaseapp.com",
  projectId: "task-management-b680b",
  storageBucket: "task-management-b680b.appspot.com",
  messagingSenderId: "285747453583",
  appId: "1:285747453583:web:cc636df543867b3119dafa",
  measurementId: "G-ESPEKRLRNK",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const googleAuthProvider = new GoogleAuthProvider();
const db = getFirestore(app);
const storage = getStorage(app);

export { googleAuthProvider, auth, db, storage };

// const analytics = getAnalytics(app);
