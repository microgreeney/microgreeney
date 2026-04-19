import { db, auth } from "./firebase-auth.js";
import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

// 🔥 Generate Order ID
function generateOrderId() {
  return "MG" + Date.now();
}

// 🇲🇾 Malaysia Time Format
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

// 🚀 Place Order Function
export async function placeOrder(cartItems, total, customerInfo) {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, async (user) => {
      try {
        const orderId = generateOrderId();

        const orderData = {
          orderId: orderId,
          userId: user ? user.uid : null,
          customerName: customerInfo.name || "",
          email: customerInfo.email || (user?.email || ""),
          phone: customerInfo.phone || "",
          address: customerInfo.address || "",
          items: cartItems || [],
          total: Number(total) || 0,
          status: "Pending",

          // 🕒 Timeline for tracking
          timeline: [
            {
              status: "Pending",
              time: getMalaysiaTimeString()
            }
          ],

          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        // 🔥 Save to Firestore
        await setDoc(doc(db, "orders", orderId), orderData);

        // 🧹 Clear cart
        localStorage.removeItem("cart");

        resolve(orderId);

      } catch (error) {
        console.error(error);
        reject(error);
      }
    });
  });
}
