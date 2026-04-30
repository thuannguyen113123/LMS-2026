import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import dotenv from "dotenv";

dotenv.config();
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: "classroommanagement-47bf3.firebaseapp.com",
  projectId: "classroommanagement-47bf3",
  storageBucket: "classroommanagement-47bf3.firebasestorage.app",
  messagingSenderId: "256369807734",
  appId: "1:256369807734:web:4949187d9ee92b27a16a57",
  measurementId: "G-J5213M3KNY",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
