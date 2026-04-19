/* ================= STORAGE KEYS ================= */
const CART_KEY = "microgreeney_cart";
const USER_KEY = "microgreeney_user";

/* ================= HELPERS ================= */
function getCart() {
  try {
    return JSON.parse(sessionStorage.getItem(CART_KEY)) || [];
  } catch (error) {
    return [];
  }
}

function saveCart(cart) {
  sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function getUser() {
  try {
    return JSON.parse(sessionStorage.getItem(USER_KEY)) || null;
  } catch (error) {
    return null;
  }
}

function formatPrice(value) {
  return Number(value).toFixed(2);
}

let cart = getCart();

/* ================= NAVBAR ================= */
const menuToggle = document.getElementById("menuToggle");
const navMenu = document.getElementById("navMenu");

if (menuToggle && navMenu) {
  menuToggle.addEventListener("click", () => {
    navMenu.classList.toggle("show");
  });

  document.addEventListener("click", (e) => {
    const clickedInsideMenu = navMenu.contains(e.target);
    const clickedToggle = menuToggle.contains(e.target);

    if (!clickedInsideMenu && !clickedToggle) {
      navMenu.classList.remove("show");
    }
  });

  navMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("show");
    });
  });
}

/* ================= CONTACT FORM ================= */
const contactForm = document.getElementById("contactForm");

if (contactForm) {
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const msg = document.getElementById("contactMessage");
    if (msg) {
      msg.textContent = "Thank you. Your message has been sent.";
    }

    contactForm.reset();
  });
}

/* ================= REVEAL ANIMATION ================= */
const reveals = document.querySelectorAll(".reveal");

function revealOnScroll() {
  reveals.forEach((element) => {
    const windowHeight = window.innerHeight;
    const elementTop = element.getBoundingClientRect().top;

    if (elementTop < windowHeight - 100) {
      element.classList.add("active");
    }
  });
}

window.addEventListener("scroll", revealOnScroll);
revealOnScroll();

/* ================= CART COUNT ================= */
function updateCartCount() {
  cart = getCart();

  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const desktopCount = document.getElementById("cart-count");
  const mobileCount = document.getElementById("cart-count-mobile");

  if (desktopCount) {
    desktopCount.textContent = totalItems;
  }

  if (mobileCount) {
    mobileCount.textContent = totalItems;
  }
}

updateCartCount();

/* ================= ADD TO CART ================= */
const cartButtons = document.querySelectorAll(".add-to-cart");

cartButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const name = button.getAttribute("data-name");
    const price = parseFloat(button.getAttribute("data-price"));

    if (!name || Number.isNaN(price)) return;

    cart = getCart();

    const existingItem = cart.find(
      (item) => item.name === name && Number(item.price) === price
    );

    if (existingItem) {
      existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
      cart.push({
        name,
        price,
        quantity: 1
      });
    }

    saveCart(cart);
    updateCartCount();

    const originalText = button.textContent;
    button.textContent = "Added";

    setTimeout(() => {
      button.textContent = originalText;
    }, 1200);
  });
});

/* ================= CART PAGE ================= */
const cartItemsContainer = document.getElementById("cart-items");
const cartTotalElement = document.getElementById("cart-total");
const emptyCart = document.getElementById("empty-cart");

function renderCartPage() {
  if (!cartItemsContainer || !cartTotalElement) return;

  cart = getCart();
  cartItemsContainer.innerHTML = "";

  if (cart.length === 0) {
    if (emptyCart) emptyCart.style.display = "block";
    cartTotalElement.textContent = "0.00";
    return;
  }

  if (emptyCart) {
    emptyCart.style.display = "none";
  }

  let total = 0;

  cart.forEach((item) => {
    const quantity = item.quantity || 1;
    const subtotal = Number(item.price) * quantity;
    total += subtotal;

    const div = document.createElement("div");
    div.classList.add("cart-item");

    div.innerHTML = `
      <div>
        <p>${item.name}</p>
        <small>RM ${formatPrice(item.price)} each</small>
      </div>

      <div style="display:flex; align-items:center; gap:10px;">
        <button class="btn btn-outline cart-minus" type="button">-</button>
        <span>${quantity}</span>
        <button class="btn btn-outline cart-plus" type="button">+</button>
      </div>

      <div>
        <strong>RM ${formatPrice(subtotal)}</strong>
      </div>

      <button class="btn btn-outline cart-remove" type="button">
        Remove
      </button>
    `;

    const minusBtn = div.querySelector(".cart-minus");
    const plusBtn = div.querySelector(".cart-plus");
    const removeBtn = div.querySelector(".cart-remove");

    plusBtn.addEventListener("click", () => increaseItem(item.name, item.price));
    minusBtn.addEventListener("click", () => decreaseItem(item.name, item.price));
    removeBtn.addEventListener("click", () => removeAllItem(item.name, item.price));

    cartItemsContainer.appendChild(div);
  });

  cartTotalElement.textContent = formatPrice(total);
}

function findItemIndex(name, price) {
  cart = getCart();
  return cart.findIndex(
    (item) => item.name === name && Number(item.price) === Number(price)
  );
}

function increaseItem(name, price) {
  const index = findItemIndex(name, price);
  if (index === -1) return;

  cart[index].quantity = (cart[index].quantity || 1) + 1;
  saveCart(cart);
  updateCartCount();
  renderCartPage();
}

function decreaseItem(name, price) {
  const index = findItemIndex(name, price);
  if (index === -1) return;

  cart[index].quantity = (cart[index].quantity || 1) - 1;

  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
  }

  saveCart(cart);
  updateCartCount();
  renderCartPage();
}

function removeAllItem(name, price) {
  cart = getCart().filter(
    (item) => !(item.name === name && Number(item.price) === Number(price))
  );

  saveCart(cart);
  updateCartCount();
  renderCartPage();
}

renderCartPage();

/* ================= AUTO-FILL CUSTOMER NAME ================= */
function autofillCustomerDetails() {
  const currentUserData = getUser();

  if (!currentUserData) return;

  const nameInput = document.getElementById("customerName");
  if (nameInput && !nameInput.value.trim()) {
    nameInput.value = currentUserData.name || "";
  }
}

autofillCustomerDetails();

/* ================= WHATSAPP CHECKOUT ================= */
window.checkoutWhatsApp = async function () {
  const user = getUser();
  cart = getCart();

  if (!user) {
    alert("Please login before placing an order.");
    window.location.href = "login.html";
    return;
  }

  if (cart.length === 0) {
    alert("Your cart is empty.");
    return;
  }

  const customerName = document.getElementById("customerName")?.value.trim();
  const customerPhone = document.getElementById("customerPhone")?.value.trim();
  const customerAddress = document.getElementById("customerAddress")?.value.trim();

  if (!customerName || !customerPhone || !customerAddress) {
    alert("Please fill in your name, phone number, and address first.");
    return;
  }

  const whatsappNumber = "601110659774";

  let total = 0;
  const orderItems = cart.map((item) => {
    const quantity = item.quantity || 1;
    const subtotal = Number(item.price) * quantity;
    total += subtotal;

    return {
      name: item.name,
      price: Number(item.price),
      quantity,
      subtotal
    };
  });

  const orderData = {
    userId: user.uid || "",
    userName: user.name || "",
    userEmail: user.email || "",
    customerName,
    customerPhone,
    customerAddress,
    items: orderItems,
    total,
    status: "pending",
    createdAt: new Date().toISOString()
  };

  let orderId = null;

  if (typeof window.saveOrderToFirebase === "function") {
    try {
      orderId = await window.saveOrderToFirebase(orderData);
    } catch (error) {
      orderId = null;
    }
  }

  if (!orderId) {
    alert("Failed to save order. Please try again.");
    return;
  }

  let message = `Hello, I would like to place an order:\n\n`;
  message += `Order ID: ${orderId}\n`;
  message += `Name: ${customerName}\n`;
  message += `Phone: ${customerPhone}\n`;
  message += `Address: ${customerAddress}\n\n`;
  message += `Order Details:\n`;

  orderItems.forEach((item) => {
    message += `• ${item.name} x${item.quantity} = RM ${formatPrice(item.subtotal)}\n`;
  });

  message += `\nTotal: RM ${formatPrice(total)}\n\n`;
  message += `Please confirm my order. Thank you.`;

  const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  window.open(whatsappURL, "_blank");

  sessionStorage.removeItem(CART_KEY);
  cart = [];
  updateCartCount();
  renderCartPage();
};

/* ================= USER DISPLAY ================= */
function updateUserDisplay() {
  const user = getUser();
  const userNameEl = document.getElementById("userName");
  const guestSection = document.getElementById("guestSection");
  const userSection = document.getElementById("userSection");

  if (user) {
    if (userNameEl) {
      userNameEl.textContent = `Hi, ${user.name || "User"}`;
    }

    if (guestSection) {
      guestSection.style.display = "none";
    }

    if (userSection) {
      userSection.style.display = "flex";
    }
  } else {
    if (guestSection) {
      guestSection.style.display = "block";
    }

    if (userSection) {
      userSection.style.display = "none";
    }
  }
}

updateUserDisplay();
