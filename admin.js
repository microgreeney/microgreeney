import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

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

const adminOrders = document.getElementById("adminOrders");

/* ================= ADMIN EMAIL ================= */
/* CHANGE THIS TO YOUR EMAIL */
const ADMIN_EMAIL = "microgreeney@gmail.com";

function formatDate(value) {
  if (!value) return "N/A";

  try {
    if (typeof value === "string") {
      return new Date(value).toLocaleString();
    }

    if (value.seconds) {
      return new Date(value.seconds * 1000).toLocaleString();
    }

    return "N/A";
  } catch (error) {
    return "N/A";
  }
}

function formatItems(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return "<li>No items</li>";
  }

  return items
    .map((item) => {
      const qty = item.quantity || 1;
      const subtotal = Number(item.subtotal || 0).toFixed(2);
      return `<li>${item.name} × ${qty} — RM ${subtotal}</li>`;
    })
    .join("");
}

function showAccessDenied(message) {
  if (!adminOrders) return;

  adminOrders.innerHTML = `
    <div class="admin-empty">
      <p>${message}</p>
    </div>
  `;
}

window.loadOrders = async function () {
  if (!adminOrders) return;

  adminOrders.innerHTML = `<p class="admin-empty">Loading orders...</p>`;

  try {
    const ordersRef = collection(db, "orders");
    let snapshot;

    try {
      const q = query(ordersRef, orderBy("firebaseCreatedAt", "desc"));
      snapshot = await getDocs(q);
    } catch (error) {
      snapshot = await getDocs(ordersRef);
    }

    if (snapshot.empty) {
      adminOrders.innerHTML = `<p class="admin-empty">No orders found yet.</p>`;
      return;
    }

    let html = "";

    snapshot.forEach((docSnap) => {
      const order = docSnap.data();

      html += `
        <article class="admin-order-card">
          <div class="admin-order-top">
            <div>
              <h3>Order ID: ${docSnap.id}</h3>
              <p><strong>Status:</strong> ${order.status || "pending"}</p>
            </div>
            <span class="admin-order-date">${formatDate(order.createdAt || order.firebaseCreatedAt)}</span>
          </div>

          <div class="admin-order-body">
            <div class="admin-order-section">
              <h4>Customer</h4>
              <p><strong>Name:</strong> ${order.customerName || "-"}</p>
              <p><strong>Phone:</strong> ${order.customerPhone || "-"}</p>
              <p><strong>Address:</strong> ${order.customerAddress || "-"}</p>
              <p><strong>Email:</strong> ${order.userEmail || "-"}</p>
            </div>

            <div class="admin-order-section">
              <h4>Items</h4>
              <ul class="admin-items-list">
                ${formatItems(order.items)}
              </ul>
            </div>
          </div>

          <div class="admin-order-footer">
            <strong>Total: RM ${Number(order.total || 0).toFixed(2)}</strong>
          </div>
        </article>
      `;
    });

    adminOrders.innerHTML = html;
  } catch (error) {
    console.error("Error loading orders:", error);
    adminOrders.innerHTML = `<p class="admin-empty">Failed to load orders.</p>`;
  }
};

/* ================= PROTECT ADMIN PAGE ================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    showAccessDenied("Access denied. Please login with the admin account.");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
    return;
  }

  if ((user.email || "").toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    showAccessDenied("Access denied. This page is only for the admin.");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);
    return;
  }

  loadOrders();
});
