import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBjaJZ-vip0vgr0naAZcwJntUnxFtqU9ak",
  authDomain: "agora-vai-7bf9e.firebaseapp.com",
  projectId: "agora-vai-7bf9e",
  storageBucket: "agora-vai-7bf9e.firebasestorage.app",
  messagingSenderId: "197006065182",
  appId: "1:197006065182:web:8435a88f0d3090dd0eb80f",
  measurementId: "G-JTB9LPQ24B"
};

const app = initializeApp(firebaseConfig);

export const analytics = getAnalytics(app);
export const auth = getAuth(app); //