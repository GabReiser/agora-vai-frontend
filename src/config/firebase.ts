import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { browserLocalPersistence, getAuth, setPersistence } from "firebase/auth";

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

export const analyticsPromise = isSupported()
  .then((supported) => (supported ? getAnalytics(app) : undefined))
  .catch(() => undefined);

export const auth = getAuth(app); //

void setPersistence(auth, browserLocalPersistence);

