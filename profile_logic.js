// profile_logic.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
    getAuth, onAuthStateChanged, signOut, updateProfile as updateAuthProfile,
    updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
    getFirestore, doc, getDoc, setDoc, serverTimestamp, // Added serverTimestamp for consistency
    collection, query, where, orderBy, getDocs
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCx5tv97A5GBce-iOECUYs_3G_IIm9TKB0", // YOUR EXACT CONFIG
    authDomain: "lecoindoux-6fda5.firebaseapp.com",    // YOUR EXACT CONFIG
    projectId: "lecoindoux-6fda5",                     // YOUR EXACT CONFIG
    storageBucket: "lecoindoux-6fda5.appspot.com",   // YOUR EXACT CONFIG
    messagingSenderId: "945779817294",               // YOUR EXACT CONFIG
    appId: "1:945779817294:web:aa4940fbeee23e69d8fc1f", // YOUR EXACT CONFIG
    measurementId: "G-ZNYERDRF1T"                      // YOUR EXACT CONFIG
};
console.log("profile_logic.js: Firebase config set. Ensure it's IDENTICAL to other _logic.js files.");

const app = initializeApp(firebaseConfig);
console.log("profile_logic.js: Firebase app initialized.");
const auth = getAuth(app);
console.log("profile_logic.js: Firebase auth instance obtained.");
const db = getFirestore(app);
console.log("profile_logic.js: Firestore instance obtained.");

// DOM Elements (IDs must match your profile.html)
const loadingProfileDiv = document.getElementById('loadingProfile');
const profilePageContentDiv = document.getElementById('profilePageContent');

const profileTabs = document.querySelectorAll('.profile-tab');
const tabContents = document.querySelectorAll('.tab-content');

// Elements within Profile Details Tab
const userNameDisplaySpan = document.getElementById('userNameDisplay');    // For displaying name in profile header
const userEmailDisplaySpan = document.getElementById('userEmail');       // For displaying email in profile header
const userPhoneDisplaySpan = document.getElementById('userPhoneDisplay');  // For displaying phone
const userAddressDisplaySpan = document.getElementById('userAddressDisplay'); // For displaying address

const displayNameInput = document.getElementById('newDisplayName');      // Input for new display name
const emailEditInput = document.getElementById('email');               // Input for new email
const currentPasswordInput = document.getElementById('currentPassword');
const newPasswordInput = document.getElementById('newPassword');
const phoneNumberInput = document.getElementById('newPhoneNumber');    // Input for new phone number
const addressInput = document.getElementById('newAddress');            // Input for new address

const saveProfileBtn = document.getElementById('saveProfileBtn');
const profileMessageDiv = document.getElementById('profileMessage');

// Elements within Order History Tab
const orderMessageDiv = document.getElementById('orderMessage');
const orderHistoryListUL = document.getElementById('orderHistoryList'); // The UL
const noOrdersMessageP = document.getElementById('noOrdersMessage');

const signOutBtn = document.getElementById('signOutBtn');
// const deleteAccountBtn = document.getElementById('deleteAccountBtn'); // If you add this feature

let currentAuthUser = null; // Holds Firebase Auth user object
let currentUserFirestoreData = {}; // Holds data from 'users' Firestore collection

// --- Utility to show messages ---
function showMessage(element, message, isError = false, duration = 4000) {
    if (!element) {
        console.warn("profile_logic.js: showMessage - Target element is null. Message:", message);
        alert(message);
        return;
    }
    element.textContent = message;
    element.className = 'message-feedback';
    element.classList.add(isError ? 'error' : (message.toLowerCase().includes("duke ngarkuar") || message.toLowerCase().includes("duke ruajtur") ? 'info' : 'success'));
    element.style.display = 'block';
    console.log(`profile_logic.js: showMessage - Displaying on ${element.id || 'unknown element'}: ${message}`);

    if (duration > 0) {
        setTimeout(() => {
            if (element) { // Check if element still exists
                 element.style.display = 'none';
                 element.textContent = '';
            }
        }, duration);
    }
}

// --- Tab Switching Logic ---
function switchTab(targetTabId) { // e.g., "profileDetailsTab" or "orderHistoryTab"
    console.log("profile_logic.js: Attempting to switch to tab:", targetTabId);
    let foundTabAndContent = false;
    profileTabs.forEach(tab => {
        if (tab.dataset.tab === targetTabId) {
            tab.classList.add('active');
            foundTabAndContent = true; // Assume content will also be found by ID
        } else {
            tab.classList.remove('active');
        }
    });
    tabContents.forEach(content => {
        if (content.id === targetTabId) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });

    if (foundTabAndContent) {
        console.log("profile_logic.js: Switched to tab:", targetTabId);
        if (targetTabId === 'orderHistoryTab' && window.location.hash !== '#orders') {
            history.pushState(null, null, '#orders');
        } else if (targetTabId === 'profileDetailsTab' && window.location.hash !== '#profile' && window.location.hash !== '') {
            history.pushState(null, null, '#profile');
        }
        // If switching to orders tab and orders haven't been loaded yet, or you want to refresh:
        if (targetTabId === 'orderHistoryTab' && currentAuthUser) {
            // Check if ordersListUL is empty or has a placeholder to decide whether to reload
            if (!orderHistoryListUL.dataset.loaded || orderHistoryListUL.dataset.loaded === "false") {
                 console.log("profile_logic.js: Orders tab activated, fetching orders.");
                 fetchUserOrders(); // Uses global currentAuthUser
            }
        }
    } else {
        console.warn("profile_logic.js: Could not find tab button or content for targetTabId:", targetTabId, ". Defaulting to profileDetailsTab.");
        const defaultTabBtn = document.querySelector('.profile-tab[data-tab="profileDetailsTab"]');
        const defaultTabContent = document.getElementById('profileDetailsTab');
        if (defaultTabBtn) defaultTabBtn.classList.add('active');
        if (defaultTabContent) defaultTabContent.classList.add('active');
    }
}

// --- Firebase Auth State Observer ---
console.log("profile_logic.js: Setting up onAuthStateChanged listener.");
onAuthStateChanged(auth, async (user) => {
    console.log("profile_logic.js: onAuthStateChanged event. User:", user ? user.email : "Not logged in");
    if (user) {
        currentAuthUser = user;
        if (loadingProfileDiv) loadingProfileDiv.style.display = 'none';
        if (profilePageContentDiv) profilePageContentDiv.style.display = 'block';

        await loadUserProfileData();
        await checkAndShowAdminTab();
        initializeAdminAccess();

        const hash = window.location.hash;
        console.log("profile_logic.js: Current URL hash:", hash);
        if (hash === '#orders') {
            switchTab('orders');
        } else {
            switchTab('profile');
        }
    } else {
        currentAuthUser = null;
        currentUserFirestoreData = {};
        if (loadingProfileDiv) loadingProfileDiv.style.display = 'block';
        if (profilePageContentDiv) profilePageContentDiv.style.display = 'none';
        console.log("profile_logic.js: User not logged in. Redirecting to login page.");
        window.location.href = `login.html?redirect=${encodeURIComponent('profile.html' + window.location.hash)}`;
    }
});

// --- Check if user is admin ---
async function checkAdminStatus() {
    if (!currentAuthUser) return false;
    try {
        const userDocRef = doc(db, "users", currentAuthUser.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists() && docSnap.data().isAdmin) {
            return true;
        }
        return false;
    } catch (error) {
        console.error("Error checking admin status:", error);
        return false;
    }
}

// --- Show admin button if user is admin ---
async function showAdminButton() {
    const isAdmin = await checkAdminStatus();
    if (isAdmin) {
        const adminBtnContainer = document.createElement('div');
        adminBtnContainer.className = 'admin-button-container';
        adminBtnContainer.style.textAlign = 'center';
        adminBtnContainer.style.marginTop = '20px';
        
        const adminBtn = document.createElement('button');
        adminBtn.className = 'btn-admin';
        adminBtn.textContent = 'Hyr në Panelin e Adminit';
        adminBtn.style.backgroundColor = '#ff7c08';
        adminBtn.style.color = 'white';
        adminBtn.style.padding = '10px 20px';
        adminBtn.style.border = 'none';
        adminBtn.style.borderRadius = '5px';
        adminBtn.style.cursor = 'pointer';
        
        adminBtn.addEventListener('click', () => {
            window.location.href = 'admin_code_entry.html';
        });
        
        adminBtnContainer.appendChild(adminBtn);
        
        // Insert after profile content
        const profileContent = document.querySelector('.profile-content');
        if (profileContent) {
            profileContent.appendChild(adminBtnContainer);
        }
    }
}

// --- Load User Profile Data (Auth and Firestore) ---
async function loadUserProfileData() {
    if (!currentAuthUser) {
        console.warn("profile_logic.js: loadUserProfileData - No authenticated user.");
        return;
    }
    console.log("profile_logic.js: loadUserProfileData - Loading data for user:", currentAuthUser.uid, currentAuthUser.email);

    // Populate from Auth object
    if (userNameDisplaySpan) userNameDisplaySpan.textContent = currentAuthUser.displayName || 'Përdorues';
    if (userEmailDisplaySpan) userEmailDisplaySpan.textContent = currentAuthUser.email;
    if (displayNameInput) displayNameInput.value = currentAuthUser.displayName || '';
    if (emailEditInput) emailEditInput.value = currentAuthUser.email;

    // Fetch and populate from Firestore "users" collection
    try {
        const userDocRef = doc(db, "users", currentAuthUser.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            currentUserFirestoreData = docSnap.data();
            console.log("profile_logic.js: Firestore user data fetched:", currentUserFirestoreData);
            if (phoneNumberInput) phoneNumberInput.value = currentUserFirestoreData.phoneNumber || '';
            if (addressInput) addressInput.value = currentUserFirestoreData.address || '';
            if (userPhoneDisplaySpan) userPhoneDisplaySpan.textContent = `Telefoni: ${currentUserFirestoreData.phoneNumber || 'Nuk është vendosur'}`;
            if (userAddressDisplaySpan) userAddressDisplaySpan.textContent = `Adresa: ${currentUserFirestoreData.address || 'Nuk është vendosur'}`;
            
            // Add admin button if user is admin
            await showAdminButton();
        } else {
            console.warn("profile_logic.js: User document not found in Firestore for UID:", currentAuthUser.uid, "- Will attempt to create/update on save.");
            currentUserFirestoreData = { email: currentAuthUser.email, displayName: currentAuthUser.displayName || '' }; // Initialize with auth data
            if (userPhoneDisplaySpan) userPhoneDisplaySpan.textContent = 'Telefoni: Nuk është vendosur';
            if (userAddressDisplaySpan) userAddressDisplaySpan.textContent = 'Adresa: Nuk është vendosur';
        }
    } catch (error) {
        console.error("profile_logic.js: Error fetching user data from Firestore:", error);
        showMessage(profileMessageDiv, "Gabim në ngarkimin e detajeve të profilit.", true);
    }
}

// --- Save Profile Changes ---
async function handleSaveProfile() {
    if (!currentAuthUser) {
        showMessage(profileMessageDiv, "Duhet të jeni i kyçur për të ruajtur ndryshimet.", true);
        return;
    }
    console.log("profile_logic.js: handleSaveProfile called.");
    showMessage(profileMessageDiv, "Duke ruajtur ndryshimet...", false, 0);

    const newDisplayName = displayNameInput.value.trim();
    const newEmailValue = emailEditInput.value.trim();
    const currentPassword = currentPasswordInput.value; // No trim
    const newPassword = newPasswordInput.value;         // No trim
    const newPhoneNumber = phoneNumberInput.value.trim();
    const newAddress = addressInput.value.trim();

    let authProfileUpdated = false;
    let firestoreDataUpdated = false;

    try {
        // Update Auth display name
        if (newDisplayName !== (currentAuthUser.displayName || '')) {
            console.log("profile_logic.js: Updating Auth display name to:", newDisplayName);
            await updateAuthProfile(currentAuthUser, { displayName: newDisplayName });
            authProfileUpdated = true;
        }

        // Update Auth email (requires re-authentication)
        if (newEmailValue !== currentAuthUser.email) {
            if (!currentPassword) {
                throw new Error("Fjalëkalimi aktual kërkohet për të ndryshuar email-in.");
            }
            console.log("profile_logic.js: Attempting to update email.");
            const credential = EmailAuthProvider.credential(currentAuthUser.email, currentPassword);
            await reauthenticateWithCredential(currentAuthUser, credential);
            await updateEmail(currentAuthUser, newEmailValue);
            console.log("profile_logic.js: Email updated in Auth.");
            authProfileUpdated = true;
        }

        // Update Auth password (requires re-authentication)
        if (newPassword) {
            if (!currentPassword) {
                throw new Error("Fjalëkalimi aktual kërkohet për të ndryshuar fjalëkalimin.");
            }
            if (newPassword.length < 6) {
                throw new Error("Fjalëkalimi i ri duhet të ketë të paktën 6 karaktere.");
            }
            console.log("profile_logic.js: Attempting to update password.");
            const credential = EmailAuthProvider.credential(currentAuthUser.email, currentPassword);
            await reauthenticateWithCredential(currentAuthUser, credential);
            await updatePassword(currentAuthUser, newPassword);
            console.log("profile_logic.js: Password updated in Auth.");
            authProfileUpdated = true;
        }

        // Prepare data for Firestore "users" collection update
        const firestoreUpdates = {};
        // Only include fields if they have actually changed from what's in Firestore (or initial Auth for new users)
        if (newDisplayName !== (currentUserFirestoreData.displayName || (currentAuthUser.displayName || ''))) firestoreUpdates.displayName = newDisplayName;
        if (newEmailValue !== (currentUserFirestoreData.email || currentAuthUser.email)) firestoreUpdates.email = newEmailValue;
        if (newPhoneNumber !== (currentUserFirestoreData.phoneNumber || '')) firestoreUpdates.phoneNumber = newPhoneNumber;
        if (newAddress !== (currentUserFirestoreData.address || '')) firestoreUpdates.address = newAddress;
        
        if (Object.keys(firestoreUpdates).length > 0) {
            firestoreUpdates.updatedAt = serverTimestamp(); // Add/update timestamp
            console.log("profile_logic.js: Updating Firestore 'users' document with:", firestoreUpdates);
            const userDocRef = doc(db, "users", currentAuthUser.uid);
            await setDoc(userDocRef, firestoreUpdates, { merge: true }); // merge:true is important
            firestoreDataUpdated = true;
        }

        await loadUserProfileData(); // Re-fetch and update all UI elements for consistency

        if (authProfileUpdated || firestoreDataUpdated) {
            showMessage(profileMessageDiv, "Profili u përditësua me sukses!", false);
        } else {
            showMessage(profileMessageDiv, "Nuk kishte ndryshime për të ruajtur.", false);
        }
        if (currentPasswordInput) currentPasswordInput.value = '';
        if (newPasswordInput) newPasswordInput.value = '';

    } catch (error) {
        console.error("profile_logic.js: Error saving profile:", error);
        let errMsg = "Gabim gjatë përditësimit të profilit.";
        if (error.code === 'auth/wrong-password') {
            errMsg = "Fjalëkalimi aktual është i pasaktë.";
        } else if (error.code === 'auth/requires-recent-login') {
            errMsg = "Ky veprim kërkon ri-kyçje. Ju lutem dilni dhe kyçuni përsëri.";
        } else if (error.message) {
            errMsg = error.message;
        }
        showMessage(profileMessageDiv, errMsg, true);
    }
}

// --- Sign Out ---
async function handleSignOut() {
    console.log("profile_logic.js: handleSignOut function called");
    try {
        await signOut(auth);
        // onAuthStateChanged will handle redirect
    } catch (error) {
        console.error('profile_logic.js: Error signing out:', error);
        showMessage(profileMessageDiv, 'Gabim gjatë daljes.', true);
    }
}

// --- Fetch User Orders ---
async function fetchUserOrders() { // Removed userId param, uses global currentAuthUser
    console.log("-----------------------------------------------------");
    console.log("profile_logic.js: fetchUserOrders - INITIATED");
    console.log("-----------------------------------------------------");

    if (!currentAuthUser || !currentAuthUser.uid) {
        console.error("profile_logic.js: fetchUserOrders - ABORTING: currentAuthUser or UID is missing.");
        if (orderMessageDiv) showMessage(orderMessageDiv, "Përdoruesi nuk u gjet. Provoni të rikyçeni.", true);
        return;
    }
    const userIdToQuery = currentAuthUser.uid;
    console.log(`profile_logic.js: fetchUserOrders - User ID to query for: "${userIdToQuery}"`);

    if (!ordersListUL) {
        console.error("profile_logic.js: fetchUserOrders - ABORTING: ordersListUL (HTML element with id='orderHistoryList') is null.");
        if (orderMessageDiv) showMessage(orderMessageDiv, "Problem teknik: Lista e porosive mungon.", true);
        return;
    }
    

    showMessage(orderMessageDiv, "Duke ngarkuar historinë e porosive...", false, 0);
    if (noOrdersMessageP) noOrdersMessageP.style.display = 'none';
    ordersListUL.innerHTML = '';
    ordersListUL.dataset.loaded = "false";

    try {
        const ordersCollectionRef = collection(db, "orders");
        const q = query(ordersCollectionRef, where("userId", "==", userIdToQuery), orderBy("createdAt", "desc"));
        console.log("profile_logic.js: fetchUserOrders - Executing Firestore query for orders...");
        
        const querySnapshot = await getDocs(q);
        console.log(`profile_logic.js: fetchUserOrders - Query Snapshot: Empty: ${querySnapshot.empty}, Size: ${querySnapshot.size}`);

        if (querySnapshot.empty) {
            if (noOrdersMessageP) noOrdersMessageP.style.display = 'block';
            if (orderMessageDiv) orderMessageDiv.style.display = 'none';
            ordersListUL.dataset.loaded = "true";
            return;
        }

        let renderedOrdersCount = 0;
        querySnapshot.forEach((docSnap) => {
            renderedOrdersCount++;
            const orderId = docSnap.id;
            const orderData = docSnap.data();
            console.log(`profile_logic.js: fetchUserOrders - Processing Order ID: ${orderId}`, JSON.parse(JSON.stringify(orderData)));

            const orderElement = document.createElement('li');
            orderElement.className = 'order-item-card'; // From your CSS

            let orderDate = 'Data e panjohur';
            if (orderData.createdAt && typeof orderData.createdAt.toDate === 'function') {
                orderDate = orderData.createdAt.toDate().toLocaleDateString('sq-AL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            } else if (orderData.createdAt && orderData.createdAt.seconds) {
                orderDate = new Date(orderData.createdAt.seconds * 1000).toLocaleDateString('sq-AL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            }

            let itemsHTML = '<ul class="order-card-items-list">';
            if (orderData.items && Array.isArray(orderData.items) && orderData.items.length > 0) {
                orderData.items.forEach((item, index) => {
                    const itemName = item.name || `Artikull ${index + 1}`;
                    const itemQuantity = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1;
                    const itemPrice = typeof item.price === 'number' ? item.price : 0;
                    itemsHTML += `<li class="order-item-row"><span>${itemName} (x${itemQuantity})</span><span>ALL ${(itemPrice * itemQuantity).toFixed(2)}</span></li>`;
                });
            } else { itemsHTML += '<li>Nuk ka detaje për artikujt.</li>'; }
            itemsHTML += '</ul>';
            
            const status = orderData.status || 'Në Pritje';
            const statusClass = status.toLowerCase().replace(/\s+/g, '-') || 'pending';
            const totalAmount = typeof orderData.totalAmount === 'number' ? orderData.totalAmount.toFixed(2) : 'N/A';

            orderElement.innerHTML = `
                <div class="order-card-header"><h4>Porosia ID: ${orderId.substring(0,10)}...</h4><span class="order-card-date">${orderDate}</span></div>
                <div style="margin: 10px 0;"><span class="order-card-status ${statusClass}">${status}</span></div>
                <div class="order-card-items-section"><strong>Artikujt:</strong>${itemsHTML}</div>
                <div class="order-card-total">Total: ALL ${totalAmount}</div>`;
            ordersListUL.appendChild(orderElement);
        });
        console.log(`profile_logic.js: fetchUserOrders - Rendered ${renderedOrdersCount} orders.`);
        if (orderMessageDiv) orderMessageDiv.style.display = 'none';
        ordersListUL.dataset.loaded = "true";

    } catch (error) { /* ... same detailed error logging as before ... */ }
    console.log("profile_logic.js: fetchUserOrders - COMPLETED.");
    
}

// Function to load user orders
async function loadUserOrders() {
    if (!currentAuthUser) return;
    
    const ordersList = document.getElementById('ordersList');
    if (!ordersList) return;
    
    ordersList.innerHTML = '<div class="loading-orders">Duke ngarkuar porositë...</div>';
    
    try {
        const ordersRef = collection(db, "orders");
        const q = query(ordersRef, 
            where("userId", "==", currentAuthUser.uid),
            orderBy("createdAt", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        const orders = [];
        
        querySnapshot.forEach((doc) => {
            orders.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        if (orders.length === 0) {
            ordersList.innerHTML = '<div class="no-orders">Nuk keni asnjë porosi ende.</div>';
            return;
        }
        
        const ordersHTML = orders.map(order => {
            const date = order.createdAt?.toDate?.() || new Date(order.createdAt?.seconds * 1000);
            const dateStr = date instanceof Date ? date.toLocaleDateString('sq-AL') : 'N/A';
            const status = order.status || 'pending';
            
            return `
                <div class="order-item">
                    <div class="order-header">
                        <span class="order-id">Porosia #${order.id.substring(0, 8)}</span>
                        <span class="order-date">${dateStr}</span>
                    </div>
                    <div class="order-info">
                        <span class="status-badge status-${status}">${getStatusInAlbanian(status)}</span>
                        <span class="order-total">ALL ${parseFloat(order.totalAmount || 0).toFixed(2)}</span>
                    </div>
                </div>
            `;
        }).join('');
        
        ordersList.innerHTML = ordersHTML;
        
    } catch (error) {
        console.error("Error loading orders:", error);
        ordersList.innerHTML = '<div class="no-orders">Gabim gjatë ngarkimit të porosive.</div>';
    }
}

// Function to translate order status to Albanian
function getStatusInAlbanian(status) {
    const translations = {
        'pending': 'Në pritje',
        'processing': 'Duke u procesuar',
        'completed': 'Përfunduar',
        'cancelled': 'Anuluar',
        'delivered': 'Dorëzuar',
        'returned': 'Kthyer'
    };
    return translations[status] || status;
}

// Check if user is admin
async function checkAndShowAdminTab() {
    try {
        const userDocRef = doc(db, "users", currentAuthUser.uid);
        const docSnap = await getDoc(userDocRef);
        
        if (docSnap.exists() && docSnap.data().isAdmin) {
            const adminTab = document.querySelector('.admin-tab');
            if (adminTab) {
                adminTab.style.display = 'block';
            }
        }
    } catch (error) {
        console.error("Error checking admin status:", error);
    }
}

// Initialize admin functionality
function initializeAdminAccess() {
    const verifyAdminBtn = document.getElementById('verifyAdminBtn');
    const adminCodeInput = document.getElementById('adminCode');
    const adminMessage = document.getElementById('adminMessage');

    if (verifyAdminBtn && adminCodeInput) {
        verifyAdminBtn.addEventListener('click', () => {
            const code = adminCodeInput.value.trim();
            
            if (code === '123456') { // You can change this to your desired admin code
                showMessage(adminMessage, 'Duke ju ridrejtuar në panelin e adminit...', false);
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 1500);
            } else {
                showMessage(adminMessage, 'Kodi i administratorit është i pasaktë!', true);
                adminCodeInput.value = '';
            }
        });
    }
}

// --- Attach Event Listeners to Buttons ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("profile_logic.js: DOMContentLoaded. Attaching button listeners.");

    const currentSaveProfileBtn = document.getElementById('saveProfileBtn'); // Re-get within DOMContentLoaded
    if (currentSaveProfileBtn) {
        currentSaveProfileBtn.addEventListener('click', handleSaveProfile);
        console.log("profile_logic.js: Event listener attached to saveProfileBtn.");
    } else {
        console.warn("profile_logic.js: saveProfileBtn NOT FOUND on DOMContentLoaded.");
    }

    const currentSignOutBtn = document.getElementById('signOutBtn'); // Re-get
    if (currentSignOutBtn) {
        currentSignOutBtn.addEventListener('click', handleSignOut);
        console.log("profile_logic.js: Event listener attached to signOutBtn.");
    } else {
        console.warn("profile_logic.js: signOutBtn NOT FOUND on DOMContentLoaded.");
    }
    // onAuthStateChanged will handle initial data load and tab setting
});

console.log("profile_logic.js: Script execution finished.");