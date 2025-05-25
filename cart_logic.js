// cart_logic.js (for cart.html page)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCx5tv97A5GBce-iOECUYs_3G_IIm9TKB0", // YOUR EXACT AND CONSISTENT CONFIG
    authDomain: "lecoindoux-6fda5.firebaseapp.com",    // YOUR EXACT AND CONSISTENT CONFIG
    projectId: "lecoindoux-6fda5",                     // YOUR EXACT AND CONSISTENT CONFIG
    storageBucket: "lecoindoux-6fda5.appspot.com",   // YOUR EXACT AND CONSISTENT CONFIG
    messagingSenderId: "945779817294",               // YOUR EXACT AND CONSISTENT CONFIG
    appId: "1:945779817294:web:aa4940fbeee23e69d8fc1f", // YOUR EXACT AND CONSISTENT CONFIG
    measurementId: "G-ZNYERDRF1T"                      // YOUR EXACT AND CONSISTENT CONFIG
};
console.log("cart_logic.js: Firebase config used:", firebaseConfig);

const app = initializeApp(firebaseConfig);
console.log("cart_logic.js: App initialized.");
const auth = getAuth(app);
console.log("cart_logic.js: Auth initialized.");
const db = getFirestore(app);
console.log("cart_logic.js: Firestore initialized.");

// DOM Elements for cart.html page
const cartItemListContainer_PAGE = document.getElementById('cartItemList');
const cartTotalDisplayPage_PAGE = document.getElementById('cartTotal');
const placeOrderBtnPage_PAGE = document.getElementById('placeOrderBtn');
const clearCartBtnPage_PAGE = document.getElementById('clearCartBtn');
const cartMessagePage_PAGE = document.getElementById('cartMessage');
const loginToOrderLinkPage_PAGE = document.getElementById('loginToOrderLink');

console.log("cart_logic.js: DOM Elements Check:", {
    cartItemListContainer: !!cartItemListContainer_PAGE,
    cartTotalDisplay: !!cartTotalDisplayPage_PAGE,
    placeOrderBtn: !!placeOrderBtnPage_PAGE,
    clearCartBtn: !!clearCartBtnPage_PAGE,
    cartMessage: !!cartMessagePage_PAGE,
    loginToOrderLink: !!loginToOrderLinkPage_PAGE
});

let currentUser = null;

function getCartFromStorage() {
    const cartString = localStorage.getItem('leCoinDouxCart');
    console.log("cart_logic.js: getCartFromStorage - Raw string:", cartString);
    try {
        const parsedCart = cartString ? JSON.parse(cartString) : [];
        console.log("cart_logic.js: getCartFromStorage - Parsed cart:", parsedCart);
        return parsedCart;
    } catch (e) {
        console.error("cart_logic.js: Error parsing cart from localStorage:", e, "Raw string:", cartString);
        localStorage.removeItem('leCoinDouxCart');
        return [];
    }
}

function saveCartToStorage(cart) {
    console.log("cart_logic.js: saveCartToStorage - Saving:", cart);
    localStorage.setItem('leCoinDouxCart', JSON.stringify(cart));
    renderCartPageItems();
    updateCartIconNumberHeaderGlobal();
}

function updateCartIconNumberHeaderGlobal() {
    const cartNumberDisplayGlobal = document.querySelector('#cartNumberDisplay');
    if (cartNumberDisplayGlobal) {
        const cart = getCartFromStorage();
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartNumberDisplayGlobal.textContent = totalItems;
    }
}

function updateCartItemQuantityOnPage(productId, change) {
    console.log(`cart_logic.js: updateCartItemQuantityOnPage - Product ID: ${productId}, Change: ${change}`);
    let cart = getCartFromStorage();
    const itemIndex = cart.findIndex(item => item.id === productId);
    if (itemIndex > -1) {
        cart[itemIndex].quantity += change;
        if (cart[itemIndex].quantity <= 0) {
            console.log(`cart_logic.js: Removing item ${productId} due to quantity <= 0`);
            cart.splice(itemIndex, 1);
        }
        saveCartToStorage(cart);
    } else {
        console.warn(`cart_logic.js: Product ID ${productId} not found in cart for quantity update.`);
    }
}

function removeCartItemFromPage(productId) {
    console.log(`cart_logic.js: removeCartItemFromPage - Product ID: ${productId}`);
    let cart = getCartFromStorage();
    cart = cart.filter(item => item.id !== productId);
    saveCartToStorage(cart);
}

function renderCartPageItems() {
    console.log("cart_logic.js: renderCartPageItems CALLED.");
    if (!cartItemListContainer_PAGE || !cartTotalDisplayPage_PAGE) {
        console.error("cart_logic.js: CRITICAL - cartItemListContainer_PAGE or cartTotalDisplayPage_PAGE is NULL! Check HTML IDs 'cartItemList' and 'cartTotal'.");
        return;
    }

    const cart = getCartFromStorage();
    console.log("cart_logic.js: renderCartPageItems - Cart data for rendering:", cart);

    cartItemListContainer_PAGE.innerHTML = ''; // Clear current items
    let totalPrice = 0;

    if (cart.length === 0) {
        console.log("cart_logic.js: Cart is empty, displaying empty message.");
        const emptyMsgP = document.createElement('p');
        emptyMsgP.id = "emptyCartMessage"; // This was the ID of the static p in your HTML
        emptyMsgP.textContent = "Shporta juaj është bosh.";
        emptyMsgP.style.textAlign = "center";
        emptyMsgP.style.padding = "20px";
        emptyMsgP.style.fontStyle = "italic";
        emptyMsgP.style.color = "#777";
        cartItemListContainer_PAGE.appendChild(emptyMsgP);
        if (placeOrderBtnPage_PAGE) placeOrderBtnPage_PAGE.disabled = true;
    } else {
        console.log(`cart_logic.js: Cart has ${cart.length} item(s). Rendering them.`);
        cart.forEach(item => {
            const listItem = document.createElement('li');
            listItem.dataset.id = item.id;
            listItem.innerHTML = `
                <div class="cart-item-details-page">
                    <strong>${item.name}</strong>
                    <span>ALL ${item.price.toFixed(2)}</span>
                    ${item.notes ? `<p class="item-notes-display-page" style="font-size:0.8em; color:grey; margin-top:3px;"><em>Shënim: ${item.notes}</em></p>` : ''}
                </div>
                <div class="quantity-controls-page" style="margin: 0 10px;">
                    <button class="decrease-qty-page" data-id="${item.id}">-</button>
                    <span class="item-quantity-page" style="padding: 0 8px;">${item.quantity}</span>
                    <button class="increase-qty-page" data-id="${item.id}">+</button>
                </div>
                <div class="item-subtotal-page" style="min-width: 70px; text-align: right; font-weight: bold;">
                    ALL ${(item.price * item.quantity).toFixed(2)}
                </div>
                <button class="remove-item-button-page remove-item-page" data-id="${item.id}" title="Hiqe" style="margin-left:10px; background: #ff4d4d; color:white; border:none; padding: 5px 8px; cursor:pointer; border-radius:3px;">×</button>
            `;
            cartItemListContainer_PAGE.appendChild(listItem);
            totalPrice += item.price * item.quantity;
        });
        // This enabling/disabling is better handled by checkLoginForOrderButtonPage
        // if (placeOrderBtnPage_PAGE) placeOrderBtnPage_PAGE.disabled = false; 
    }
    cartTotalDisplayPage_PAGE.textContent = totalPrice.toFixed(2);
    console.log("cart_logic.js: renderCartPageItems - Total price set to:", totalPrice.toFixed(2));
    checkLoginForOrderButtonPage();
}

// Event delegation for cart.html item controls
if (cartItemListContainer_PAGE) {
    cartItemListContainer_PAGE.addEventListener('click', (event) => {
        const target = event.target;
        const buttonClicked = target.closest('button');
        if (!buttonClicked) return;

        const productId = buttonClicked.dataset.id;
        console.log("cart_logic.js: Click on cart.html list. Button:", buttonClicked.className, "ID:", productId);

        if (!productId) return;

        if (buttonClicked.classList.contains('decrease-qty-page')) {
            updateCartItemQuantityOnPage(productId, -1);
        } else if (buttonClicked.classList.contains('increase-qty-page')) {
            updateCartItemQuantityOnPage(productId, 1);
        } else if (buttonClicked.classList.contains('remove-item-page')) {
            if (confirm(`Jeni i sigurt që doni të hiqni këtë artikull?`)) {
                removeCartItemFromPage(productId);
            }
        }
    });
} else {
    console.warn("cart_logic.js: cartItemListContainer_PAGE (for item controls) is null!");
}

if (clearCartBtnPage_PAGE) {
    clearCartBtnPage_PAGE.addEventListener('click', () => {
        console.log("cart_logic.js: 'Pastro Shportën' button CLICKED.");
        if (confirm("Jeni i sigurt që doni të pastroni të gjithë shportën?")) {
            saveCartToStorage([]);
        }
    });
} else {
    console.warn("cart_logic.js: clearCartBtnPage_PAGE is null! Check ID 'clearCartBtn'.");
}

onAuthStateChanged(auth, (user) => {
    console.log("cart_logic.js: onAuthStateChanged fired. User:", user ? user.email : "NULL");
    currentUser = user;
    checkLoginForOrderButtonPage();
});

function checkLoginForOrderButtonPage() {
    console.log("cart_logic.js: checkLoginForOrderButtonPage called. Current user:", currentUser ? currentUser.email : "NULL");
    if (!placeOrderBtnPage_PAGE || !loginToOrderLinkPage_PAGE) {
        console.warn("cart_logic.js: Place order button or login link not found for checkLogin.");
        return;
    }
    const cart = getCartFromStorage();
    if (cart.length > 0) {
        if (currentUser) {
            placeOrderBtnPage_PAGE.disabled = false;
            loginToOrderLinkPage_PAGE.style.display = 'none';
            placeOrderBtnPage_PAGE.textContent = "Vazhdo me Porosinë";
        } else {
            placeOrderBtnPage_PAGE.disabled = true;
            loginToOrderLinkPage_PAGE.style.display = 'block';
            placeOrderBtnPage_PAGE.textContent = "Hyni për të porositur";
        }
    } else {
        placeOrderBtnPage_PAGE.disabled = true;
        loginToOrderLinkPage_PAGE.style.display = 'none';
        placeOrderBtnPage_PAGE.textContent = "Shporta është bosh";
    }
    console.log("cart_logic.js: placeOrderBtnPage_PAGE.disabled state:", placeOrderBtnPage_PAGE.disabled);
}

if (placeOrderBtnPage_PAGE) {
    placeOrderBtnPage_PAGE.addEventListener('click', async () => {
        console.log("cart_logic.js: 'Vazhdo me Porosinë' button CLICKED.");
        if (!currentUser) {
            if (cartMessagePage_PAGE) {
                cartMessagePage_PAGE.textContent = "Ju duhet të hyni për të bërë një porosi.";
                cartMessagePage_PAGE.style.color = "red";
            }
            window.location.href = `login.html?redirect=${encodeURIComponent('cart.html')}`;
            return;
        }
        const cart = getCartFromStorage();
        if (cart.length === 0) {
            if (cartMessagePage_PAGE) {
                cartMessagePage_PAGE.textContent = "Shporta juaj është bosh.";
                cartMessagePage_PAGE.style.color = "red";
            }
            return;
        }

        if (cartMessagePage_PAGE) {
            cartMessagePage_PAGE.textContent = "Duke procesuar porosinë...";
            cartMessagePage_PAGE.style.color = "blue";
        }
        placeOrderBtnPage_PAGE.disabled = true;

        const orderData = {
            userId: currentUser.uid,
            userEmail: currentUser.email,
            userName: currentUser.displayName || 'N/A',
            items: cart,
            totalAmount: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
            status: "pending",
            createdAt: serverTimestamp()
        };
        console.log("cart_logic.js: Order data to be sent to Firestore:", orderData);

        try {
            const docRef = await addDoc(collection(db, "orders"), orderData);
            console.log("cart_logic.js: Order placed successfully! Firestore Doc ID:", docRef.id);
            if (cartMessagePage_PAGE) {
                cartMessagePage_PAGE.textContent = `Porosia u krye me sukses! ID: ${docRef.id.substring(0,8)}...`;
                cartMessagePage_PAGE.style.color = "green";
            }
            saveCartToStorage([]);
            setTimeout(() => {
                window.location.href = 'profile.html';
            }, 3000);
        } catch (error) {
            console.error("cart_logic.js: Error placing order in Firestore: ", error);
            if (cartMessagePage_PAGE) {
                cartMessagePage_PAGE.textContent = "Gabim gjatë kryerjes së porosisë: " + error.message;
                cartMessagePage_PAGE.style.color = "red";
            }
            if (placeOrderBtnPage_PAGE) placeOrderBtnPage_PAGE.disabled = false;
        }
    });
} else {
    console.warn("cart_logic.js: placeOrderBtnPage_PAGE is null! Check ID 'placeOrderBtn'.");
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("cart_logic.js: DOMContentLoaded on cart.html. Initializing page display.");
    if(!cartItemListContainer_PAGE) {
        console.error("CRITICAL: cartItemListContainer_PAGE is null even after DOMContentLoaded. Check ID 'cartItemList' in cart.html");
    }
    renderCartPageItems();
    updateCartIconNumberHeaderGlobal();
});

console.log("cart_logic.js: Script finished loading.");