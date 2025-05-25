// app_logic.js (for index.html)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCx5tv97A5GBce-iOECUYs_3G_IIm9TKB0", // YOUR EXACT CONFIG
    authDomain: "lecoindoux-6fda5.firebaseapp.com",    // YOUR EXACT CONFIG
    projectId: "lecoindoux-6fda5",                     // YOUR EXACT CONFIG
    storageBucket: "lecoindoux-6fda5.appspot.com",   // YOUR EXACT CONFIG
    messagingSenderId: "945779817294",               // YOUR EXACT CONFIG
    appId: "1:945779817294:web:aa4940fbeee23e69d8fc1f", // YOUR EXACT CONFIG
    measurementId: "G-ZNYERDRF1T"                      // YOUR EXACT CONFIG
};
console.log("app_logic.js (index.html): Config set. Ensure it matches ALL other _logic.js files!");

const app = initializeApp(firebaseConfig);
console.log("app_logic.js (index.html): Firebase app initialized.");
const auth = getAuth(app);
console.log("app_logic.js (index.html): Firebase auth instance obtained.");

// DOM Elements for index.html Header
const userIconLink = document.getElementById('userIconLink');
const cartIconHeader = document.getElementById('cartIcon'); // The <a> tag in the header
const cartNumberDisplayHeader = document.getElementById('cartNumberDisplay');
const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');

// Sidebar DOM Elements - These IDs MUST match your index.html
const cartSidebar = document.getElementById('cartSidebar');
const closeCartSidebarBtn = document.getElementById('closeCartSidebar');
const sidebarCartItemsContainer = document.getElementById('sidebarCartItems'); // Container for items
const sidebarCartTotalDisplay = document.getElementById('sidebarCartTotal'); // Span for total in sidebar
const cartOverlay = document.getElementById('cartOverlay');

// Log found sidebar elements to confirm IDs are correct
console.log("app_logic.js: Sidebar elements check:", {
    cartSidebar: !!cartSidebar,
    closeCartSidebarBtn: !!closeCartSidebarBtn,
    sidebarCartItemsContainer: !!sidebarCartItemsContainer,
    sidebarCartTotalDisplay: !!sidebarCartTotalDisplay,
    cartOverlay: !!cartOverlay
});

let currentUserState = null; // Variable to hold the current auth user state

// --- Cart Management (using localStorage) ---
function getCartFromStorage() {
    const cartString = localStorage.getItem('leCoinDouxCart');
    try {
        return cartString ? JSON.parse(cartString) : [];
    } catch (e) {
        console.error("app_logic.js: Error parsing cart from localStorage:", e, "Cart string was:", cartString);
        localStorage.removeItem('leCoinDouxCart'); // Clear corrupted cart
        return [];
    }
}

function saveCartToStorage(cart) {
    console.log("app_logic.js: Saving to cart storage:", cart);
    localStorage.setItem('leCoinDouxCart', JSON.stringify(cart));
    updateCartIconNumberHeader();
    renderSidebarCart(); // CRITICAL: Update the sidebar whenever the cart changes
}

function addItemToCart(productId, productName, productPrice) {
    console.log(`app_logic.js: addItemToCart called for ${productName} (ID: ${productId}, Price: ${productPrice})`);
    let cart = getCartFromStorage();
    const existingItemIndex = cart.findIndex(item => item.id === productId);

    if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity += 1;
        console.log(`app_logic.js: Increased quantity for ${productName}`);
    } else {
        cart.push({ id: productId, name: productName, price: productPrice, quantity: 1, notes: "" });
        console.log(`app_logic.js: Added new item ${productName} to cart array`);
    }
    saveCartToStorage(cart);
    openCartSidebar(); // Open sidebar when item is added

    if (cartIconHeader) { // Animate header cart icon
        cartIconHeader.classList.add('cart-updated');
        setTimeout(() => cartIconHeader.classList.remove('cart-updated'), 500);
    }
}

function updateCartItemQuantityInStorage(productId, newQuantity) {
    let cart = getCartFromStorage();
    const itemIndex = cart.findIndex(item => item.id === productId);
    if (itemIndex > -1) {
        if (newQuantity <= 0) {
            cart.splice(itemIndex, 1); // Remove item if quantity becomes 0 or less
        } else {
            cart[itemIndex].quantity = newQuantity;
        }
        saveCartToStorage(cart);
    }
}

function updateCartItemNotesInStorage(productId, newNotes) {
    let cart = getCartFromStorage();
    const itemIndex = cart.findIndex(item => item.id === productId);
    if (itemIndex > -1) {
        cart[itemIndex].notes = newNotes;
        saveCartToStorage(cart); // This will call renderSidebarCart
    }
}

function removeItemFromCartInStorage(productId) {
    let cart = getCartFromStorage();
    cart = cart.filter(item => item.id !== productId);
    saveCartToStorage(cart);
}

function updateCartIconNumberHeader() {
    const cart = getCartFromStorage();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartNumberDisplayHeader) {
        cartNumberDisplayHeader.textContent = totalItems;
    }
}

// --- Cart Sidebar Logic ---
function openCartSidebar() {
    console.log("app_logic.js: openCartSidebar called.");
    if (cartSidebar && cartOverlay) {
        cartSidebar.classList.add('open');
        cartOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        renderSidebarCart(); // Ensure content is up-to-date
    } else {
        console.error("app_logic.js: cartSidebar or cartOverlay element not found when trying to open.");
    }
}

function closeCartSidebar() {
    console.log("app_logic.js: closeCartSidebar called.");
    if (cartSidebar && cartOverlay) {
        cartSidebar.classList.remove('open');
        cartOverlay.classList.remove('active');
        document.body.style.overflow = '';
    } else {
        console.error("app_logic.js: cartSidebar or cartOverlay element not found when trying to close.");
    }
}

function renderSidebarCart() {
    console.log("app_logic.js: renderSidebarCart called.");
    if (!sidebarCartItemsContainer || !sidebarCartTotalDisplay) {
        console.error("app_logic.js: sidebarCartItemsContainer or sidebarCartTotalDisplay element not found for rendering.");
        return;
    }

    const cart = getCartFromStorage();
    console.log("app_logic.js: Rendering sidebar with cart:", cart);
    sidebarCartItemsContainer.innerHTML = ''; // Clear previous items
    let totalPrice = 0;

    if (cart.length === 0) {
        sidebarCartItemsContainer.innerHTML = '<p class="empty-cart-sidebar-msg">Shporta juaj është bosh.</p>';
    } else {
        cart.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.classList.add('sidebar-cart-item');
            // The HTML structure for each item in the sidebar
            itemElement.innerHTML = `
                <div class="sidebar-item-details">
                    <h4>${item.name}</h4>
                    <p class="sidebar-item-price">ALL ${item.price.toFixed(2)}</p>
                    <div class="sidebar-item-actions">
                        <button class="quantity-controls decrease-qty" data-id="${item.id}">-</button>
                        <span class="quantity-display">${item.quantity}</span>
                        <button class="quantity-controls increase-qty" data-id="${item.id}">+</button>
                        <button class="remove-sidebar-item-btn" data-id="${item.id}" title="Hiqe">×</button>
                    </div>
                    <div class="sidebar-item-notes">
                        <textarea class="item-notes-input" data-id="${item.id}" placeholder="Shënim special (opsionale)...">${item.notes || ''}</textarea>
                    </div>
                    <p class="sidebar-item-subtotal">Subtotal: ALL ${(item.price * item.quantity).toFixed(2)}</p>
                </div>
            `;
            sidebarCartItemsContainer.appendChild(itemElement);
            totalPrice += item.price * item.quantity;
        });
    }
    sidebarCartTotalDisplay.textContent = totalPrice.toFixed(2);
}

// --- Event Listeners Setup ---

// Listener for Authentication State Changes
console.log("app_logic.js (index.html): Attaching onAuthStateChanged listener.");
onAuthStateChanged(auth, (user) => {
    console.log("app_logic.js (index.html): onAuthStateChanged FIRED. User:", user ? user.email : "NULL");
    currentUserState = user;
    if (userIconLink) {
        userIconLink.href = user ? "profile.html" : "login.html";
        console.log("app_logic.js (index.html): userIconLink.href set to:", userIconLink.href);
    } else {
        console.error("app_logic.js (index.html): userIconLink element NOT FOUND!");
    }
    updateCartIconNumberHeader();
});

// Event listeners for general sidebar controls (open/close)
if (cartIconHeader) {
    cartIconHeader.addEventListener('click', (e) => {
        e.preventDefault();
        console.log("app_logic.js: Header cart icon CLICKED. Opening sidebar.");
        openCartSidebar();
    });
} else {
    console.warn("app_logic.js: cartIconHeader (for opening sidebar) not found.");
}

if (closeCartSidebarBtn) {
    closeCartSidebarBtn.addEventListener('click', closeCartSidebar);
} else {
    console.warn("app_logic.js: closeCartSidebarBtn not found.");
}

if (cartOverlay) {
    cartOverlay.addEventListener('click', closeCartSidebar);
} else {
    console.warn("app_logic.js: cartOverlay not found.");
}

// Event delegation for controls INSIDE the sidebar (quantity, remove, notes)
if (sidebarCartItemsContainer) {
    sidebarCartItemsContainer.addEventListener('click', (event) => {
        const target = event.target;
        const buttonClicked = target.closest('button'); // Find the button if an icon was clicked
        if (!buttonClicked) return;

        const productId = buttonClicked.dataset.id;
        console.log("app_logic.js: Click inside sidebar items. Button Clicked:", buttonClicked, "Product ID:", productId);

        if (!productId) return;

        let cart = getCartFromStorage();
        const item = cart.find(i => i.id === productId);
        if (!item) {
            console.warn("app_logic.js: Clicked item's product ID not found in cart storage:", productId);
            return;
        }

        if (buttonClicked.classList.contains('decrease-qty')) {
            updateCartItemQuantityInStorage(productId, item.quantity - 1);
        } else if (buttonClicked.classList.contains('increase-qty')) {
            updateCartItemQuantityInStorage(productId, item.quantity + 1);
        } else if (buttonClicked.classList.contains('remove-sidebar-item-btn')) {
            // Optional: Add a confirmation dialog
            if (confirm(`Jeni i sigurt që doni të hiqni "${item.name}" nga shporta?`)) {
                 removeItemFromCartInStorage(productId);
            }
        }
    });

    sidebarCartItemsContainer.addEventListener('input', (event) => {
        const target = event.target;
        const productId = target.dataset.id;
        if (target.classList.contains('item-notes-input') && productId) {
            // Debounce this for better performance if users type quickly
            // For now, direct update:
            updateCartItemNotesInStorage(productId, target.value);
        }
    });
} else {
    console.warn("app_logic.js: sidebarCartItemsContainer not found for event delegation. Sidebar item controls won't work.");
}

// Event listeners for "Add to Cart" buttons on index.html product list
console.log("app_logic.js (index.html): Setting up 'add to cart' product button listeners. Found buttons:", addToCartButtons.length);
addToCartButtons.forEach(button => {
    button.addEventListener('click', (event) => {
        console.log("app_logic.js (index.html): Product 'Add to cart' button CLICKED.");
        const dishBox = event.target.closest('.dish-box-wp');
        if (dishBox) {
            const productId = dishBox.dataset.productId;
            const productName = dishBox.dataset.productName;
            const productPrice = parseFloat(dishBox.dataset.productPrice);
            console.log("app_logic.js (index.html): Product data from dishBox:", { productId, productName, productPrice });

            if (productId && productName && !isNaN(productPrice)) {
                addItemToCart(productId, productName, productPrice);
            } else {
                console.error("app_logic.js (index.html): Product data missing/invalid on dishBox.", dishBox.dataset);
            }
        } else {
            console.error("app_logic.js (index.html): .dish-box-wp parent not found for product button.");
        }
    });
});

// Initial setup when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log("app_logic.js (index.html): DOMContentLoaded. Performing initial cart setup.");
    updateCartIconNumberHeader();
    renderSidebarCart(); // Render initial state of sidebar (it's hidden by CSS initially but content is ready)
});

console.log("app_logic.js (index.html): Script fully loaded and initialized.");
