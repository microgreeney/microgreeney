import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

// 🔥 CORRECT CONFIG (FIXED API KEY)
const firebaseConfig = {
  apiKey: "AIzaSyB-yUbY1KzYCs1bTuMOFlJZoktrJ74TMGk",
  authDomain: "microgreeney-aab7b.firebaseapp.com",
  projectId: "microgreeney-aab7b",
  storageBucket: "microgreeney-aab7b.firebasestorage.app",
  messagingSenderId: "416610459992",
  appId: "1:416610459992:web:898a7b44460cb04750452d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Forms
const signupForm = document.getElementById("signupForm");
const loginForm = document.getElementById("loginForm");

// =======================
// SIGNUP
// =======================
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim().toLowerCase();
    const password = document.getElementById("signupPassword").value.trim();
    const msg = document.getElementById("signupMessage");

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, "users", userCred.user.uid), {
        uid: userCred.user.uid,
        name,
        email,
        createdAt: serverTimestamp()
      });

      msg.textContent = "Account created successfully!";
      msg.style.color = "green";

      signupForm.reset();
    } catch (err) {
      msg.textContent = err.message;
      msg.style.color = "red";
    }
  });
}

// =======================
// LOGIN
// =======================
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value.trim();
    const msg = document.getElementById("loginMessage");

    try {
      await signInWithEmailAndPassword(auth, email, password);

      msg.textContent = "Login successful!";
      msg.style.color = "green";

      setTimeout(() => {
        window.location.href = "index.html";
      }, 1000);

    } catch (err) {
      msg.textContent = err.message;
      msg.style.color = "red";
    }
  });
}

// =======================
// SAVE USER SESSION
// =======================
onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  const docSnap = await getDoc(doc(db, "users", user.uid));

  if (docSnap.exists()) {
    localStorage.setItem("user", JSON.stringify(docSnap.data()));
  }
});

// =======================
// LOGOUT
// =======================
window.logoutUser = async function () {
  await signOut(auth);
  localStorage.removeItem("user");
  window.location.href = "login.html";
};