import { auth, db } from "./firebase-auth.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const myOrdersList = document.getElementById("myOrdersList");
const myOrdersMessage = document.getElementById("myOrdersMessage");

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

  return items.map((item) => {
    const qty = item.quantity || 1;
    const subtotal = Number(item.subtotal || 0).toFixed(2);
    return `<li>${item.name} × ${qty} — RM ${subtotal}</li>`;
  }).join("");
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

function showMessage(text) {
  if (!myOrdersMessage) return;
  myOrdersMessage.style.display = "block";
  myOrdersMessage.textContent = text;
}

function hideMessage() {
  if (!myOrdersMessage) return;
  myOrdersMessage.style.display = "none";
  myOrdersMessage.textContent = "";
}

async function loadMyOrders(user) {
  if (!myOrdersList) return;

  myOrdersList.innerHTML = `<p class="admin-empty">Loading your orders...</p>`;

  try {
    const ordersRef = collection(db, "orders");
    let snapshot;

    try {
      const q = query(
        ordersRef,
        where("userId", "==", user.uid),
        orderBy("firebaseCreatedAt", "desc")
      );
      snapshot = await getDocs(q);
    } catch (error) {
      const fallbackQuery = query(ordersRef, where("userId", "==", user.uid));
      snapshot = await getDocs(fallbackQuery);
    }

    if (snapshot.empty) {
      myOrdersList.innerHTML = `<p class="admin-empty">You have no orders yet.</p>`;
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
              <h4>Delivery Details</h4>
              <p><strong>Name:</strong> ${order.customerName || "-"}</p>
              <p><strong>Phone:</strong> ${order.customerPhone || "-"}</p>
              <p><strong>Address:</strong> ${order.customerAddress || "-"}</p>
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
            <a href="track.html?orderId=${encodeURIComponent(orderId)}" class="btn btn-primary small-btn">
              View Tracking
            </a>
          </div>
        </article>
      `;
    });

    myOrdersList.innerHTML = html;
  } catch (error) {
    console.error("Error loading my orders:", error);
    myOrdersList.innerHTML = `<p class="admin-empty">Failed to load your orders.</p>`;
  }
}

onAuthStateChanged(auth, (user) => {
  if (!user) {
    showMessage("Please login to view your orders.");
    if (myOrdersList) {
      myOrdersList.innerHTML = `
        <div class="admin-empty">
          <a href="login.html" class="btn btn-primary">Go to Login</a>
        </div>
      `;
    }
    return;
  }

  hideMessage();
  loadMyOrders(user);
});
