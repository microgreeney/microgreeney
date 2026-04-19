import { auth, db } from "./firebase-auth.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const profileForm = document.getElementById("profileForm");
const profileMessage = document.getElementById("profileMessage");

const profileAvatar = document.getElementById("profileAvatar");
const profileDisplayName = document.getElementById("profileDisplayName");
const profileEmailText = document.getElementById("profileEmailText");

const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const profilePhone = document.getElementById("profilePhone");
const profileAddress = document.getElementById("profileAddress");

let currentUser = null;

function setMessage(text, isError = false) {
  if (!profileMessage) return;
  profileMessage.textContent = text;
  profileMessage.style.color = isError ? "#b42323" : "";
}

function getInitial(name, email) {
  const source = (name || email || "U").trim();
  return source.charAt(0).toUpperCase();
}

async function loadProfile(user) {
  try {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    let userData = {
      uid: user.uid,
      name: user.displayName || "User",
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

    if (profileDisplayName) {
      profileDisplayName.textContent = userData.name || "User";
    }

    if (profileEmailText) {
      profileEmailText.textContent = userData.email || "-";
    }

    if (profileAvatar) {
      profileAvatar.textContent = getInitial(userData.name, userData.email);
    }

    if (profileName) {
      profileName.value = userData.name || "";
    }

    if (profileEmail) {
      profileEmail.value = userData.email || "";
    }

    if (profilePhone) {
      profilePhone.value = userData.phone || "";
    }

    if (profileAddress) {
      profileAddress.value = userData.address || "";
    }
  } catch (error) {
    console.error("Load profile error:", error);
    setMessage("Failed to load profile.", true);
  }
}

if (profileForm) {
  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!currentUser) {
      setMessage("Please login first.", true);
      return;
    }

    const name = profileName?.value.trim() || "";
    const email = currentUser.email || "";
    const phone = profilePhone?.value.trim() || "";
    const address = profileAddress?.value.trim() || "";

    if (!name) {
      setMessage("Please enter your full name.", true);
      return;
    }

    try {
      const saveBtn = profileForm.querySelector("button[type='submit']");
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = "Saving...";
      }

      await setDoc(
        doc(db, "users", currentUser.uid),
        {
          uid: currentUser.uid,
          name,
          email,
          phone,
          address,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );

      const sessionUser = {
        uid: currentUser.uid,
        name,
        email
      };

      sessionStorage.setItem("microgreeney_user", JSON.stringify(sessionUser));

      if (profileDisplayName) {
        profileDisplayName.textContent = name;
      }

      if (profileEmailText) {
        profileEmailText.textContent = email || "-";
      }

      if (profileAvatar) {
        profileAvatar.textContent = getInitial(name, email);
      }

      const navbarUserName = document.getElementById("userName");
      if (navbarUserName) {
        navbarUserName.textContent = name;
      }

      setMessage("Profile updated successfully.");
    } catch (error) {
      console.error("Save profile error:", error);
      setMessage("Failed to save profile.", true);
    } finally {
      const saveBtn = profileForm.querySelector("button[type='submit']");
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = "Save Profile";
      }
    }
  });
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  currentUser = user;
  await loadProfile(user);
});
