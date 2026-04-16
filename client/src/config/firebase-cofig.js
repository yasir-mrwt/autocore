// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCz6OUyBxAguh_W44FeAiVNJ6G1E5C09bM",
  authDomain: "cardealership-3372f.firebaseapp.com",
  projectId: "cardealership-3372f",
  storageBucket: "cardealership-3372f.appspot.com",
  messagingSenderId: "491728415643",
  appId: "1:491728415643:web:92ecdf6699d33caed20f3e",
};

// Initialize Firebase
initializeApp(firebaseConfig);
const auth = getAuth();

export { auth };
