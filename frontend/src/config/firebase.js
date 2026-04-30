import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDQNgTIt0DDhmzFaekC21i69xVU1DC9Wuo",
  authDomain: "classroommanagement-47bf3.firebaseapp.com",
  projectId: "classroommanagement-47bf3",
  storageBucket: "classroommanagement-47bf3.appspot.com",
  messagingSenderId: "256369807734",
  appId: "1:256369807734:web:4949187d9ee92b27a16a57",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Initialize Firebase Auth
const auth = getAuth(app);

// ✅ EXPORT ra để nơi khác import được
export { app, auth };
