import { db } from "./firebase-auth.js";
import {
  doc,
  getDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const orderInput = document.getElementById("trackOrderId");
const trackBtn = document.getElementById("trackOrderBtn");
const messageEl = document.getElementById("trackMessage");

const resultBox = document.getElementById("trackResult");
const resultOrderId = document.getElementById("resultOrderId");
const resultDate = document.getElementById("resultDate");
const resultStatus = document.getElementById("resultStatus");

const resultName = document.getElementById("resultName");
const resultPhone = document.getElementById("resultPhone");
const resultAddress = document.getElementById("resultAddress");
const resultEmail = document.getElementById("resultEmail");

const resultItems = document.getElementById("resultItems");
const resultTotal = document.getElementById("resultTotal");
const resultTimeline = document.getElementById("resultTimeline");

let unsubscribe = null;

function formatDate(value) {
  if (!value) return "-";

  try {
    if (typeof value === "string") {
      return new Date(value).toLocaleString();
    }

    if (value.seconds) {
      return new Date(value.seconds * 1000).toLocaleString();
    }

    return "-";
  } catch {
    return "-";
  }
}

function formatPrice(value) {
  return Number(value || 0).toFixed(2);
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

function renderOrder(data) {
  resultOrderId.textContent = "Order ID: " + (data.orderId || "-");
  resultDate.textContent = "Created: " + formatDate(data.firebaseCreatedAt || data.createdAt);

  const currentStatus = data.status || "Pending";
  resultStatus.textContent = currentStatus;
  resultStatus.className = `status-badge ${getStatusClass(currentStatus)}`;

  resultName.textContent = data.customerName || "-";
  resultPhone.textContent = data.customerPhone || "-";
  resultAddress.textContent = data.customerAddress || "-";
  resultEmail.textContent = data.userEmail || "-";

  resultItems.innerHTML = "";

  if (Array.isArray(data.items) && data.items.length > 0) {
    data.items.forEach((item) => {
      const row = document.createElement("div");
      row.classList.add("track-item-row");
      row.innerHTML = `
        <span>${item.name} x${item.quantity || 1}</span>
        <span>RM ${formatPrice(item.subtotal)}</span>
      `;
      resultItems.appendChild(row);
    });
  } else {
    resultItems.innerHTML = `<div class="track-item-row"><span>No items</span><span>-</span></div>`;
  }

  resultTotal.textContent = formatPrice(data.total);

  resultTimeline.innerHTML = "";

  if (Array.isArray(data.timeline) && data.timeline.length > 0) {
    data.timeline.forEach((step) => {
      const item = document.createElement("div");
      item.classList.add("timeline-item");
      item.innerHTML = `
        <div class="timeline-dot"></div>
        <div>
          <strong>${step.status || "-"}</strong>
          <p>${step.time || "-"}</p>
        </div>
      `;
      resultTimeline.appendChild(item);
    });
  } else {
    resultTimeline.innerHTML = `
      <div class="timeline-item">
        <div class="timeline-dot"></div>
        <div>
          <strong>${currentStatus}</strong>
          <p>No timeline updates yet.</p>
        </div>
      </div>
    `;
  }

  resultBox.style.display = "block";
}

async function trackOrder(orderId) {
  if (!orderId) {
    messageEl.textContent = "Please enter your Order ID.";
    resultBox.style.display = "none";
    return;
  }

  messageEl.textContent = "";

  try {
    const ref = doc(db, "orders", orderId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      resultBox.style.display = "none";
      messageEl.textContent = "Order not found.";
      return;
    }

    renderOrder(snap.data());

    if (unsubscribe) unsubscribe();

    unsubscribe = onSnapshot(ref, (docSnap) => {
      if (docSnap.exists()) {
        renderOrder(docSnap.data());
      }
    });
  } catch (error) {
    console.error("Track order error:", error);
    resultBox.style.display = "none";
    messageEl.textContent = "Failed to load order.";
  }
}

if (trackBtn) {
  trackBtn.addEventListener("click", () => {
    const orderId = orderInput.value.trim();
    trackOrder(orderId);
  });
}

if (orderInput) {
  orderInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      trackOrder(orderInput.value.trim());
    }
  });
}

const params = new URLSearchParams(window.location.search);
const urlOrderId = params.get("orderId");

if (urlOrderId && orderInput) {
  orderInput.value = urlOrderId;
  trackOrder(urlOrderId);
}
