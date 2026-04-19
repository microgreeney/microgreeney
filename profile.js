import { auth, db } from "./firebase-auth.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const profileNameText = document.getElementById("profileName");
const profileEmailText = document.getElementById("profileEmail");

const updateName = document.getElementById("updateName");
const updatePhone = document.getElementById("updatePhone");
const updateAddress = document.getElementById("updateAddress");
const profileMessage = document.getElementById("profileMessage");

let currentUser = null;

function showMessage(text, isError = false) {
  if (!profileMessage) return;
  profileMessage.textContent = text;
  profileMessage.style.color = isError ? "#b42323" : "";
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

    if (profileNameText) {
      profileNameText.textContent = userData.name || "-";
    }

    if (profileEmailText) {
      profileEmailText.textContent = userData.email || "-";
    }

    if (updateName) {
      updateName.value = userData.name || "";
    }

    if (updatePhone) {
      updatePhone.value = userData.phone || "";
    }

    if (updateAddress) {
      updateAddress.value = userData.address || "";
    }
  } catch (error) {
    console.error("Load profile error:", error);
    showMessage("Failed to load profile.", true);
  }
}

window.updateProfile = async function () {
  if (!currentUser) {
    showMessage("Please login first.", true);
    return;
  }

  const name = updateName?.value.trim() || "";
  const phone = updatePhone?.value.trim() || "";
  const address = updateAddress?.value.trim() || "";
  const email = currentUser.email || "";

  if (!name) {
    showMessage("Please enter your name.", true);
    return;
  }

  try {
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

    const updatedSessionUser = {
      uid: currentUser.uid,
      name,
      email,
      phone,
      address
    };

    sessionStorage.setItem("microgreeney_user", JSON.stringify(updatedSessionUser));

    if (profileNameText) {
      profileNameText.textContent = name;
    }

    if (profileEmailText) {
      profileEmailText.textContent = email || "-";
    }

    const navbarUserName = document.getElementById("userName");
    if (navbarUserName) {
      navbarUserName.textContent = name;
    }

    showMessage("Profile updated successfully.");
  } catch (error) {
    console.error("Save profile error:", error);
    showMessage("Failed to save profile.", true);
  }
};

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  currentUser = user;
  await loadProfile(user);
});
