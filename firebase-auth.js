import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
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

/* ================= INIT ================= */
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ================= ADMIN EMAIL ================= */
const ADMIN_EMAIL = "microgreeney@gmail.com";

/* ================= GOOGLE PROVIDER ================= */
const googleProvider = new GoogleAuthProvider();

/* ================= ELEMENTS ================= */
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const tabButtons = document.querySelectorAll(".tab-btn");
const resendVerificationBtn = document.getElementById("resendVerificationBtn");

/* ================= TAB SWITCH ================= */
if (tabButtons.length) {
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const target = btn.dataset.tab;
      const login = document.getElementById("loginForm");
      const signup = document.getElementById("signupForm");

      if (!login || !signup) return;

      if (target === "loginForm") {
        login.classList.add("active-form");
        login.classList.remove("hidden-form");
        signup.classList.add("hidden-form");
        signup.classList.remove("active-form");
      } else {
        signup.classList.add("active-form");
        signup.classList.remove("hidden-form");
        login.classList.add("hidden-form");
        login.classList.remove("active-form");
      }
    });
  });
}

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
        phone: "",
        address: "",
        createdAt: serverTimestamp()
      });
    }

    alert("Login successful!");
    window.location.href = "index.html";
  } catch (error) {
    console.error("Google login error:", error);
    alert("Google login failed: " + error.message);
  }
};

/* ================= EMAIL LOGIN ================= */
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail")?.value.trim();
    const password = document.getElementById("loginPassword")?.value.trim();
    const message = document.getElementById("loginMessage");

    if (message) message.textContent = "";
    if (resendVerificationBtn) resendVerificationBtn.style.display = "none";

    if (!email || !password) {
      if (message) message.textContent = "Please fill in email and password.";
      return;
    }

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;

      await user.reload();

      if (!user.emailVerified) {
        if (message) {
          message.textContent = "Please verify your email before logging in.";
        }

        if (resendVerificationBtn) {
          resendVerificationBtn.style.display = "inline-flex";
        }

        await signOut(auth);
        return;
      }

      if (message) message.textContent = "Login successful!";
      window.location.href = "index.html";
    } catch (error) {
      console.error("Login error:", error);

      if (message) {
        switch (error.code) {
          case "auth/too-many-requests":
            message.textContent = "Too many login attempts. Please wait a while and try again.";
            break;
          case "auth/invalid-credential":
            message.textContent = "Invalid email or password.";
            break;
          case "auth/user-not-found":
            message.textContent = "No account found with this email.";
            break;
          case "auth/wrong-password":
            message.textContent = "Incorrect password.";
            break;
          default:
            message.textContent = error.message;
        }
      }
    }
  });
}

/* ================= SIGNUP ================= */
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("signupName")?.value.trim();
    const email = document.getElementById("signupEmail")?.value.trim();
    const password = document.getElementById("signupPassword")?.value.trim();
    const message = document.getElementById("signupMessage");

    if (!name || !email || !password) {
      if (message) message.textContent = "Please fill in all fields.";
      return;
    }

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name,
        email,
        phone: "",
        address: "",
        createdAt: serverTimestamp()
      });

      await sendEmailVerification(user);

      if (message) {
        message.textContent = "Signup successful! Verification email sent. Please check your inbox.";
      }

      await signOut(auth);
    } catch (error) {
      console.error("Signup error:", error);
      if (message) {
        switch (error.code) {
          case "auth/email-already-in-use":
            message.textContent = "This email is already registered.";
            break;
          case "auth/weak-password":
            message.textContent = "Password should be at least 6 characters.";
            break;
          case "auth/too-many-requests":
            message.textContent = "Too many requests. Please wait a while and try again.";
            break;
          default:
            message.textContent = error.message;
        }
      }
    }
  });
}

/* ================= RESEND VERIFICATION ================= */
if (resendVerificationBtn) {
  resendVerificationBtn.addEventListener("click", async () => {
    const email = document.getElementById("loginEmail")?.value.trim();
    const password = document.getElementById("loginPassword")?.value.trim();
    const message = document.getElementById("loginMessage");

    if (!email || !password) {
      if (message) message.textContent = "Enter your email and password first.";
      return;
    }

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;

      await user.reload();

      if (user.emailVerified) {
        if (message) message.textContent = "Your email is already verified. Please log in.";
        if (resendVerificationBtn) resendVerificationBtn.style.display = "none";
        await signOut(auth);
        return;
      }

      await sendEmailVerification(user);

      if (message) {
        message.textContent = "Verification email sent again. Please check your inbox or spam folder.";
      }

      await signOut(auth);
    } catch (error) {
      console.error("Resend verification error:", error);
      if (message) {
        switch (error.code) {
          case "auth/too-many-requests":
            message.textContent = "Too many requests. Please wait before requesting another verification email.";
            break;
          case "auth/invalid-credential":
            message.textContent = "Invalid email or password.";
            break;
          default:
            message.textContent = error.message;
        }
      }
    }
  });
}

/* ================= FORGOT PASSWORD ================= */
const forgotPasswordLink = document.getElementById("forgotPasswordLink");

if (forgotPasswordLink) {
  forgotPasswordLink.addEventListener("click", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail")?.value.trim();
    const message = document.getElementById("loginMessage");

    if (!email) {
      if (message) message.textContent = "Please enter your email first.";
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      if (message) {
        message.textContent = "Password reset email sent. Please check your inbox.";
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      if (message) {
        switch (error.code) {
          case "auth/too-many-requests":
            message.textContent = "Too many requests. Please wait a while before trying again.";
            break;
          default:
            message.textContent = error.message;
        }
      }
    }
  });
}

/* ================= LOGOUT ================= */
window.logoutUser = async function () {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout error:", error);
  }

  sessionStorage.removeItem("microgreeney_user");
  sessionStorage.removeItem("microgreeney_cart");
  window.location.href = "login.html";
};

/* ================= AUTH STATE ================= */
onAuthStateChanged(auth, async (user) => {
  const guestSection = document.getElementById("guestSection");
  const userSection = document.getElementById("userSection");
  const userNameEl = document.getElementById("userName");
  const adminLink = document.getElementById("adminLink");

  if (user) {
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      let userData = {
        uid: user.uid,
        name: user.displayName || user.email || "User",
        email: user.email || "",
        phone: "",
        address: ""
      };

      if (userSnap.exists()) {
        userData = {
          ...userData,
          ...userSnap.data()
        };
      }

      sessionStorage.setItem("microgreeney_user", JSON.stringify(userData));

      if (userNameEl) userNameEl.textContent = userData.name || userData.email || "User";
      if (guestSection) guestSection.style.display = "none";
      if (userSection) userSection.style.display = "inline-flex";

      if (adminLink) {
        if ((userData.email || "").toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
          adminLink.style.display = "inline-flex";
        } else {
          adminLink.style.display = "none";
        }
      }
    } catch (error) {
      console.error("Auth state error:", error);
    }
  } else {
    sessionStorage.removeItem("microgreeney_user");

    if (guestSection) guestSection.style.display = "block";
    if (userSection) userSection.style.display = "none";
    if (adminLink) adminLink.style.display = "none";
  }
});

/* ================= ORDER HELPERS ================= */
function generateOrderId() {
  return "MG" + Date.now();
}

function getMalaysiaTimeString() {
  const now = new Date();
  return now.toLocaleString("en-MY", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

/* ================= SAVE ORDER TO FIREBASE ================= */
window.saveOrderToFirebase = async function (orderData) {
  try {
    const orderId = generateOrderId();

    const finalOrderData = {
      ...orderData,
      orderId,
      status: orderData.status || "Pending",
      timeline: [
        {
          status: orderData.status || "Pending",
          time: getMalaysiaTimeString()
        }
      ],
      firebaseCreatedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(doc(db, "orders", orderId), finalOrderData);
    return orderId;
  } catch (error) {
    console.error("Error saving order:", error);
    return null;
  }
};

export { auth, db };
