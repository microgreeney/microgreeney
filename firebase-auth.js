import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

/* ================= FIREBASE CONFIG ================= */
const firebaseConfig = {
  apiKey: "AIzaSyBy-UbY1KzYCs1bTuMOF1JZoktRjT47MGk",
  authDomain: "microgreeney-aab7b.firebaseapp.com",
  projectId: "microgreeney-aab7b",
  storageBucket: "microgreeney-aab7b.firebasestorage.app",
  messagingSenderId: "416610459992",
  appId: "1:416610459992:web:898a7b44460cb04750452d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ================= ADMIN EMAIL ================= */
const ADMIN_EMAIL = "microgreeney@gmail.com"; // 🔥 change if needed

/* ================= GOOGLE PROVIDER ================= */
const googleProvider = new GoogleAuthProvider();

/* ================= GOOGLE LOGIN ================= */
window.loginWithGoogle = async function () {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        name: user.displayName || "User",
        email: user.email || "",
        createdAt: serverTimestamp()
      });
    }

    alert("Login successful!");
    window.location.href = "index.html";

  } catch (error) {
    console.error(error);
    alert("Google login failed: " + error.message);
  }
};

/* ================= EMAIL LOGIN ================= */
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    const message = document.getElementById("loginMessage");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      message.textContent = "Login successful!";
      window.location.href = "index.html";
    } catch (error) {
      message.textContent = error.message;
    }
  });
}

/* ================= SIGNUP ================= */
const signupForm = document.getElementById("signupForm");

if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("signupName").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;
    const message = document.getElementById("signupMessage");

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        createdAt: serverTimestamp()
      });

      message.textContent = "Signup successful!";
      window.location.href = "index.html";
    } catch (error) {
      message.textContent = error.message;
    }
  });
}

/* ================= LOGOUT ================= */
window.logoutUser = async function () {
  await signOut(auth);
  window.location.href = "login.html";
};

/* ================= AUTH STATE ================= */
onAuthStateChanged(auth, (user) => {
  const guestSection = document.getElementById("guestSection");
  const userSection = document.getElementById("userSection");
  const userNameEl = document.getElementById("userName");
  const adminLink = document.getElementById("adminLink");

  if (user) {
    const name = user.displayName || user.email;

    if (userNameEl) userNameEl.textContent = name;
    if (guestSection) guestSection.style.display = "none";
    if (userSection) userSection.style.display = "flex";

    // 🔥 SHOW ADMIN ONLY FOR YOU
    if (adminLink && user.email === ADMIN_EMAIL) {
      adminLink.style.display = "inline-flex";
    }

  } else {
    if (guestSection) guestSection.style.display = "block";
    if (userSection) userSection.style.display = "none";

    if (adminLink) adminLink.style.display = "none";
  }
});
