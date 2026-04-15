/* ================= NAVBAR ================= */
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');

if (menuToggle && navMenu) {
  menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('show');
  });
}

/* ================= CONTACT ================= */
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

/* ================= SCROLL ANIMATION ================= */
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

/* ================= CART SYSTEM ================= */
let cart = JSON.parse(localStorage.getItem('cart')) || [];

const cartCountElement = document.getElementById('cart-count');
const cartButtons = document.querySelectorAll('.add-to-cart');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalElement = document.getElementById('cart-total');
const emptyCart = document.getElementById('empty-cart');

/* Update cart count */
function updateCartCount() {
  if (cartCountElement) {
    cartCountElement.textContent = cart.length;
  }
}

updateCartCount();

/* Add to cart */
cartButtons.forEach(button => {
  button.addEventListener('click', () => {
    const name = button.dataset.name;
    const price = parseFloat(button.dataset.price);

    cart.push({ name, price });
    localStorage.setItem('cart', JSON.stringify(cart));
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
  localStorage.setItem('cart', JSON.stringify(cart));
  location.reload();
};

window.decreaseItem = function (name, price) {
  const index = cart.findIndex(item => item.name === name && item.price === price);

  if (index !== -1) {
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    location.reload();
  }
};

window.removeAllItem = function (name, price) {
  cart = cart.filter(item => !(item.name === name && item.price === price));
  localStorage.setItem('cart', JSON.stringify(cart));
  location.reload();
};

/* ================= WHATSAPP CHECKOUT ================= */
window.checkoutWhatsApp = function () {
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
};