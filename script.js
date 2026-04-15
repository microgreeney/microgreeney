/* ================= NAVBAR ================= */
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');

if (menuToggle && navMenu) {
  menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('show');
  });
}

/* ================= CONTACT FORM ================= */
const contactForm = document.getElementById('contactForm');

if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = document.getElementById('contactMessage');
    if (msg) {
      msg.textContent = 'Thank you. Your message has been sent.';
    }
    contactForm.reset();
  });
}

/* ================= REVEAL ANIMATION ================= */
const reveals = document.querySelectorAll('.reveal');

function revealOnScroll() {
  reveals.forEach((element) => {
    const windowHeight = window.innerHeight;
    const elementTop = element.getBoundingClientRect().top;

    if (elementTop < windowHeight - 100) {
      element.classList.add('active');
    }
  });
}

window.addEventListener('scroll', revealOnScroll);
revealOnScroll();

/* ================= CART ================= */
let cart = JSON.parse(sessionStorage.getItem('cart')) || [];

const cartButtons = document.querySelectorAll('.add-to-cart');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalElement = document.getElementById('cart-total');
const emptyCart = document.getElementById('empty-cart');

function saveCart() {
  sessionStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartCount() {
  const countEl = document.getElementById('cart-count');
  if (countEl) {
    countEl.textContent = cart.length;
  }
}

/* show count immediately when page loads */
updateCartCount();

/* add to cart */
cartButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const name = button.getAttribute('data-name');
    const price = parseFloat(button.getAttribute('data-price'));

    if (!name || isNaN(price)) return;

    cart.push({ name, price });
    saveCart();
    updateCartCount();

    const originalText = button.textContent;
    button.textContent = 'Added';

    setTimeout(() => {
      button.textContent = originalText;
    }, 1500);
  });
});

/* ================= DISPLAY CART ================= */
if (cartItemsContainer && cartTotalElement) {
  let total = 0;
  cartItemsContainer.innerHTML = '';

  if (cart.length === 0) {
    if (emptyCart) emptyCart.style.display = 'block';
  } else {
    if (emptyCart) emptyCart.style.display = 'none';
  }

  const groupedCart = {};

  cart.forEach(item => {
    const key = `${item.name}-${item.price}`;
    if (!groupedCart[key]) {
      groupedCart[key] = { ...item, quantity: 1 };
    } else {
      groupedCart[key].quantity++;
    }
  });

  Object.values(groupedCart).forEach(item => {
    total += item.price * item.quantity;

    const div = document.createElement('div');
    div.classList.add('cart-item');

    div.innerHTML = `
      <div>
        <p>${item.name}</p>
        <small>RM ${item.price}</small>
      </div>

      <div style="display:flex; align-items:center; gap:10px;">
        <button class="btn btn-outline" onclick="decreaseItem('${item.name}', ${item.price})">-</button>
        <span>${item.quantity}</span>
        <button class="btn btn-outline" onclick="increaseItem('${item.name}', ${item.price})">+</button>
      </div>

      <div>
        <strong>RM ${(item.price * item.quantity).toFixed(2)}</strong>
      </div>

      <button class="btn btn-outline" onclick="removeAllItem('${item.name}', ${item.price})">
        Remove
      </button>
    `;

    cartItemsContainer.appendChild(div);
  });

  cartTotalElement.textContent = total.toFixed(2);
}

/* ================= CART ACTIONS ================= */
window.increaseItem = function (name, price) {
  cart.push({ name, price });
  saveCart();
  location.reload();
};

window.decreaseItem = function (name, price) {
  const index = cart.findIndex(item => item.name === name && item.price === price);

  if (index !== -1) {
    cart.splice(index, 1);
    saveCart();
    location.reload();
  }
};

window.removeAllItem = function (name, price) {
  cart = cart.filter(item => !(item.name === name && item.price === price));
  saveCart();
  location.reload();
};

/* ================= WHATSAPP CHECKOUT ================= */
window.checkoutWhatsApp = function () {
  const user = JSON.parse(sessionStorage.getItem('user'));

  if (!user) {
    alert('Please login before placing an order.');
    window.location.href = 'login.html';
    return;
  }

  if (cart.length === 0) {
    alert('Your cart is empty.');
    return;
  }

  const customerName = document.getElementById('customerName')?.value.trim();
  const customerPhone = document.getElementById('customerPhone')?.value.trim();
  const customerAddress = document.getElementById('customerAddress')?.value.trim();

  if (!customerName || !customerPhone || !customerAddress) {
    alert('Please fill in your name, phone number, and address first.');
    return;
  }

  const whatsappNumber = '601110659774';

  const groupedCart = {};
  let total = 0;

  cart.forEach(item => {
    const key = `${item.name}-${item.price}`;
    if (!groupedCart[key]) {
      groupedCart[key] = { ...item, quantity: 1 };
    } else {
      groupedCart[key].quantity += 1;
    }
  });

  let message = 'Hello, I would like to place an order:%0A%0A';
  message += `Name: ${customerName}%0A`;
  message += `Phone: ${customerPhone}%0A`;
  message += `Address: ${customerAddress}%0A%0A`;
  message += 'Order Details:%0A';

  Object.values(groupedCart).forEach(item => {
    const subtotal = item.price * item.quantity;
    total += subtotal;
    message += `• ${item.name} x${item.quantity} = RM ${subtotal.toFixed(2)}%0A`;
  });

  message += `%0ATotal: RM ${total.toFixed(2)}%0A%0A`;
  message += 'Please confirm my order. Thank you.';

  const whatsappURL = `https://wa.me/${whatsappNumber}?text=${message}`;
  window.open(whatsappURL, '_blank');

  /* clear cart only after checkout button clicked */
  cart = [];
  sessionStorage.removeItem('cart');
  updateCartCount();

  if (cartItemsContainer) cartItemsContainer.innerHTML = '';
  if (cartTotalElement) cartTotalElement.textContent = '0';
  if (emptyCart) emptyCart.style.display = 'block';
};

/* ================= USER DISPLAY ================= */
const user = JSON.parse(sessionStorage.getItem('user'));
const userNameEl = document.getElementById('userName');
const guestSection = document.getElementById('guestSection');
const userSection = document.getElementById('userSection');

if (user) {
  if (userNameEl) {
    userNameEl.textContent = `Hi, ${user.name}`;
  }
  if (guestSection) {
    guestSection.style.display = 'none';
  }
  if (userSection) {
    userSection.style.display = 'flex';
  }
} else {
  if (guestSection) {
    guestSection.style.display = 'block';
  }
  if (userSection) {
    userSection.style.display = 'none';
  }
}
