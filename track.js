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
  resultDate.textContent = "Created: " + formatDate(data.createdAt || data.firebaseCreatedAt);

  resultStatus.textContent = data.status || "Pending";
  resultStatus.className = "status-badge " + getStatusClass(data.status);

  resultName.textContent = data.customerName || "-";
  resultPhone.textContent = data.customerPhone || "-";
  resultAddress.textContent = data.customerAddress || "-";
  resultEmail.textContent = data.userEmail || "-";

  resultItems.innerHTML = "";

  (data.items || []).forEach((item) => {
    const div = document.createElement("div");
    div.classList.add("track-item-row");
    div.innerHTML = `
      <span>${item.name} x${item.quantity}</span>
      <span>RM ${formatPrice(item.subtotal)}</span>
    `;
    resultItems.appendChild(div);
  });

  resultTotal.textContent = formatPrice(data.total);

  resultTimeline.innerHTML = "";

  (data.timeline || []).forEach((step) => {
    const div = document.createElement("div");
    div.classList.add("timeline-item");
    div.innerHTML = `
      <div class="timeline-dot"></div>
      <div>
        <strong>${step.status}</strong>
        <p>${step.time}</p>
      </div>
    `;
    resultTimeline.appendChild(div);
  });

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

const params = new URLSearchParams(window.location.search);
const urlOrderId = params.get("orderId");

if (urlOrderId) {
  orderInput.value = urlOrderId;
  trackOrder(urlOrderId);
}
