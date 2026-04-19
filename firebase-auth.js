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
  serverTimestamp,
  collection,
  addDoc
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

/* ================= INIT ================= */
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ================= STORAGE KEY ================= */
const USER_KEY = "microgreeney_user";

/* ================= ELEMENTS ================= */
const signupForm = document.getElementById("signupForm");
const loginForm = document.getElementById("loginForm");
const tabButtons = document.querySelectorAll(".tab-btn");

/* ================= LOGIN / SIGNUP TABS ================= */
if (tabButtons.length && loginForm && signupForm) {
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      const target = button.dataset.tab;

      if (target === "loginForm") {
        loginForm.classList.add("active-form");
        loginForm.classList.remove("hidden-form");
        signupForm.classList.add("hidden-form");
        signupForm.classList.remove("active-form");
      } else {
        signupForm.classList.add("active-form");
        signupForm.classList.remove("hidden-form");
        loginForm.classList.add("hidden-form");
        loginForm.classList.remove("active-form");
      }
    });
  });
}

/* ================= SIGNUP ================= */
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nameInput = document.getElementById("signupName");
    const emailInput = document.getElementById("signupEmail");
    const passwordInput = document.getElementById("signupPassword");
    const msg = document.getElementById("signupMessage");

    const name = nameInput ? nameInput.value.trim() : "";
    const email = emailInput ? emailInput.value.trim().toLowerCase() : "";
    const password = passwordInput ? passwordInput.value.trim() : "";

    if (!name || !email || !password) {
      if (msg) {
        msg.textContent = "Please fill in all fields.";
        msg.style.color = "red";
      }
      return;
    }

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, "users", userCred.user.uid), {
        uid: userCred.user.uid,
        name,
        email,
        createdAt: serverTimestamp()
      });

      if (msg) {
        msg.textContent = "Account created successfully! Please login.";
        msg.style.color = "green";
      }

      signupForm.reset();

      const loginTab = document.querySelector('[data-tab="loginForm"]');
      if (loginTab) {
        loginTab.click();
      }
    } catch (err) {
      console.error("Firebase signup error:", err);

      if (msg) {
        msg.textContent = getFriendlyAuthMessage(err);
        msg.style.color = "red";
      }
    }
  });
}

/* ================= LOGIN ================= */
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const emailInput = document.getElementById("loginEmail");
    const passwordInput = document.getElementById("loginPassword");
    const msg = document.getElementById("loginMessage");

    const email = emailInput ? emailInput.value.trim().toLowerCase() : "";
    const password = passwordInput ? passwordInput.value.trim() : "";

    if (!email || !password) {
      if (msg) {
        msg.textContent = "Please enter email and password.";
        msg.style.color = "red";
      }
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);

      if (msg) {
        msg.textContent = "Login successful!";
        msg.style.color = "green";
      }

      setTimeout(() => {
        window.location.href = "index.html";
      }, 800);
    } catch (err) {
      console.error("Firebase login error:", err);

      if (msg) {
        msg.textContent = getFriendlyAuthMessage(err);
        msg.style.color = "red";
      }
    }
  });
}

/* ================= USER SESSION ================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    sessionStorage.removeItem(USER_KEY);
    return;
  }

  try {
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      sessionStorage.setItem(USER_KEY, JSON.stringify(docSnap.data()));
    } else {
      const fallbackUser = {
        uid: user.uid,
        name: user.displayName || "User",
        email: user.email || ""
      };

      sessionStorage.setItem(USER_KEY, JSON.stringify(fallbackUser));
    }
  } catch (err) {
    console.error("User session error:", err);
  }
});

/* ================= LOGOUT ================= */
window.logoutUser = async function () {
  try {
    await signOut(auth);
  } catch (err) {
    console.error("Logout error:", err);
  }

  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem("microgreeney_cart");
  window.location.href = "login.html";
};

/* ================= SAVE ORDER ================= */
window.saveOrderToFirebase = async function (orderData) {
  try {
    const docRef = await addDoc(collection(db, "orders"), {
      ...orderData,
      firebaseCreatedAt: serverTimestamp()
    });

    return docRef.id;
  } catch (err) {
    console.error("Error saving order:", err);
    return null;
  }
};

/* ================= FRIENDLY AUTH MESSAGES ================= */
function getFriendlyAuthMessage(error) {
  const code = error?.code || "";

  switch (code) {
    case "auth/email-already-in-use":
      return "This email is already registered.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Incorrect email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    default:
      return error?.message || "Something went wrong. Please try again.";
  }
}
