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

/* ================= ADMIN EMAIL ================= */
const ADMIN_EMAIL = "microgreeney@gmail.com";

const adminOrders = document.getElementById("adminOrders");

/* ================= TIME FORMAT ================= */
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

/* ================= FORMAT DATE ================= */
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

/* ================= FORMAT ITEMS ================= */
function formatItems(items = []) {
  if (!items.length) return "<li>No items</li>";

  return items.map(item => {
    return `<li>${item.name} × ${item.quantity} — RM ${Number(item.subtotal).toFixed(2)}</li>`;
  }).join("");
}

/* ================= LOAD ORDERS ================= */
window.loadOrders = async function () {
  if (!adminOrders) return;

  adminOrders.innerHTML = `<p class="admin-empty">Loading orders...</p>`;

  try {
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, orderBy("firebaseCreatedAt", "desc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      adminOrders.innerHTML = `<p class="admin-empty">No orders found yet.</p>`;
      return;
    }

    let html = "";

    snapshot.forEach((docSnap) => {
      const order = docSnap.data();
      const id = docSnap.id;

      html += `
        <article class="admin-order-card">
          <div class="admin-order-top">
            <div>
              <h3>Order ID: ${id}</h3>
              <p><strong>Status:</strong> ${order.status || "Pending"}</p>
            </div>
            <span class="admin-order-date">${formatDate(order.firebaseCreatedAt)}</span>
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

            <div style="margin-top:10px;">
              <select id="status-${id}">
                <option>Pending</option>
                <option>Confirmed</option>
                <option>Packed</option>
                <option>Out for Delivery</option>
                <option>Delivered</option>
                <option>Cancelled</option>
              </select>

              <button onclick="updateOrderStatus('${id}')" class="btn btn-primary small-btn">
                Update
              </button>
            </div>
          </div>
        </article>
      `;
    });

    adminOrders.innerHTML = html;

  } catch (error) {
    console.error(error);
    adminOrders.innerHTML = `<p class="admin-empty">Failed to load orders.</p>`;
  }
};

/* ================= UPDATE STATUS ================= */
window.updateOrderStatus = async function (orderId) {
  try {
    const select = document.getElementById(`status-${orderId}`);
    const newStatus = select.value;

    const ref = doc(db, "orders", orderId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      alert("Order not found.");
      return;
    }

    const data = snap.data();
    const timeline = data.timeline || [];

    timeline.push({
      status: newStatus,
      time: getMalaysiaTimeString()
    });

    await updateDoc(ref, {
      status: newStatus,
      timeline: timeline,
      updatedAt: serverTimestamp()
    });

    alert("Status updated!");
    loadOrders();

  } catch (error) {
    console.error(error);
    alert("Failed to update status.");
  }
};

/* ================= PROTECT ADMIN ================= */
function showAccessDenied(message) {
  adminOrders.innerHTML = `<p class="admin-empty">${message}</p>`;
}

onAuthStateChanged(auth, (user) => {
  if (!user) {
    showAccessDenied("Login required.");
    setTimeout(() => window.location.href = "login.html", 1500);
    return;
  }

  if ((user.email || "").toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    showAccessDenied("Access denied.");
    setTimeout(() => window.location.href = "index.html", 1500);
    return;
  }

  loadOrders();
});
