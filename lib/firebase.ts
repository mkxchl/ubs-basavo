// lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBYam1KbA8gfZT6u5mURWXfhmpucfrJQ-Y",
  authDomain: "ukm-olahraga-ae76a.firebaseapp.com",
  projectId: "ukm-olahraga-ae76a",
  storageBucket: "ukm-olahraga-ae76a.firebasestorage.app",
  messagingSenderId: "139412519087",
  appId: "1:139412519087:web:e3aa2301adf1fb911d7c5a",
  measurementId: "G-09D9LHPTGC"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
