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
  orderBy,
  doc,
  updateDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

/* ================= FIREBASE ================= */
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

/* ================= ADMIN ================= */
const ADMIN_EMAIL = "microgreeney@gmail.com";
const adminOrders = document.getElementById("adminOrders");

/* ================= HELPERS ================= */
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
  } catch {
    return "N/A";
  }
}

function formatItems(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return "<li>No items</li>";
  }

  return items
    .map((item) => {
      return `<li>${item.name} × ${item.quantity || 1} — RM ${Number(item.subtotal || 0).toFixed(2)}</li>`;
    })
    .join("");
}

function getStatusClass(status) {
  const normalized = (status || "").toLowerCase();

  if (normalized === "delivered") return "status-delivered";
  if (normalized === "cancelled") return "status-cancelled";
  if (normalized === "out for delivery") return "status-delivery";
  if (normalized === "packed") return "status-packed";
  if (normalized === "confirmed") return "status-confirmed";
  return "status-pending";
}

function showAccessDenied(message) {
  if (!adminOrders) return;

  adminOrders.innerHTML = `
    <div class="admin-empty">
      <p>${message}</p>
    </div>
  `;
}

/* ================= LOAD ORDERS ================= */
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
      const orderId = order.orderId || docSnap.id;
      const status = order.status || "Pending";
      const statusClass = getStatusClass(status);

      html += `
        <article class="admin-order-card">
          <div class="admin-order-top">
            <div>
              <h3>Order ID: ${orderId}</h3>
              <p>
                <strong>Status:</strong>
                <span class="status-badge ${statusClass}">${status}</span>
              </p>
            </div>
            <span class="admin-order-date">${formatDate(order.firebaseCreatedAt || order.createdAt)}</span>
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

          <div class="admin-order-footer" style="justify-content:space-between; gap:1rem; flex-wrap:wrap;">
            <strong>Total: RM ${Number(order.total || 0).toFixed(2)}</strong>

            <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
              <select id="status-${orderId}" class="admin-status-select">
                <option value="Pending" ${status === "Pending" ? "selected" : ""}>Pending</option>
                <option value="Confirmed" ${status === "Confirmed" ? "selected" : ""}>Confirmed</option>
                <option value="Packed" ${status === "Packed" ? "selected" : ""}>Packed</option>
                <option value="Out for Delivery" ${status === "Out for Delivery" ? "selected" : ""}>Out for Delivery</option>
                <option value="Delivered" ${status === "Delivered" ? "selected" : ""}>Delivered</option>
                <option value="Cancelled" ${status === "Cancelled" ? "selected" : ""}>Cancelled</option>
              </select>

              <button class="btn btn-primary small-btn" onclick="updateOrderStatus('${orderId}')">
                Update
              </button>
            </div>
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

/* ================= UPDATE ORDER STATUS ================= */
window.updateOrderStatus = async function (orderId) {
  try {
    const select = document.getElementById(`status-${orderId}`);

    if (!select) {
      alert("Status selector not found.");
      return;
    }

    const newStatus = select.value;
    const orderRef = doc(db, "orders", orderId);
    const snap = await getDoc(orderRef);

    if (!snap.exists()) {
      alert("Order not found.");
      return;
    }

    const orderData = snap.data();
    const currentTimeline = Array.isArray(orderData.timeline) ? orderData.timeline : [];
    const currentStatus = orderData.status || "Pending";

    if (currentStatus === newStatus) {
      alert("This order already has that status.");
      return;
    }

    currentTimeline.push({
      status: newStatus,
      time: getMalaysiaTimeString()
    });

    await updateDoc(orderRef, {
      status: newStatus,
      timeline: currentTimeline,
      updatedAt: serverTimestamp()
    });

    alert("Order status updated successfully.");
    loadOrders();
  } catch (error) {
    console.error("Update status error:", error);
    alert("Failed to update order status.");
  }
};

/* ================= ADMIN PAGE PROTECTION ================= */
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
