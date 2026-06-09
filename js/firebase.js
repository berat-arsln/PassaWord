// js/firebase.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";

import {
  getDatabase,
  ref,
  push,
  onValue,
  query,
  orderByChild,
  limitToLast,
  set,
  remove,
  get,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";

import {
  getAuth,
  signInAnonymously,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

const firebaseYapılandırma = {
  apiKey: "AIzaSyBGELLtIOdSbNbBasEOjI53wTMcY9GlD6Y",
  authDomain: "passaword-3c769.firebaseapp.com",
  databaseURL:
    "https://passaword-3c769-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "passaword-3c769",
  storageBucket: "passaword-3c769.firebasestorage.app",
  messagingSenderId: "184241248120",
  appId: "1:184241248120:web:1e56d87fefd25b0971da8d",
};

const uygulama = initializeApp(firebaseYapılandırma);

const veritabani = getDatabase(uygulama);

const kimlikDogrulama = getAuth(uygulama);

signInAnonymously(kimlikDogrulama).catch(console.error);

export {
  veritabani,
  kimlikDogrulama,
  ref,
  push,
  onValue,
  query,
  orderByChild,
  limitToLast,
  set,
  remove,
  get,
};
