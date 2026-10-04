import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBrm1gk9crfG-pFQ7nCpGHBEN9npi_2gW4",
  authDomain: "us-2-25a0a.firebaseapp.com",
  projectId: "us-2-25a0a",
  storageBucket: "us-2-25a0a.firebasestorage.app",
  messagingSenderId: "863186008403",
  appId: "1:863186008403:web:756a942f302fd8358989a6",
  measurementId: "G-C1EN1NKBQM",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
