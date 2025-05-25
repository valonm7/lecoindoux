// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged, 
    signOut, 
    updateEmail, 
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    setDoc, 
    collection, 
    query, 
    where, 
    orderBy, 
    getDocs
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCx5tv97A5GBce-iOECUYs_3G_IIm9TKB0",
    authDomain: "lecoindoux-6fda5.firebaseapp.com",
    projectId: "lecoindoux-6fda5",
    storageBucket: "lecoindoux-6fda5.appspot.com",
    messagingSenderId: "945779817294",
    appId: "1:945779817294:web:aa4940fbeee23e69d8fc1f",
    measurementId: "G-ZNYERDRF1T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const userNameDisplay = document.getElementById('userNameDisplay');
const userEmail = document.getElementById('userEmail');
const emailInput = document.getElementById('email');
const currentPasswordInput = document.getElementById('currentPassword');
const newPasswordInput = document.getElementById('newPassword');
const displayNameInput = document.getElementById('displayName');
const phoneNumberInput = document.getElementById('phoneNumber');
const addressInput = document.getElementById('address');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const signOutBtn = document.getElementById('signOutBtn');
const profileTabs = document.querySelectorAll('.profile-tab');
const tabContents = document.querySelectorAll('.tab-content');
const ordersList = document.getElementById('ordersList');

let currentUser = null;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log("Profile page loaded");
    
    // Debug DOM elements
    debugDOMElements();
    
    // Set up tab switching
    profileTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;
            switchTab(tabId);
        });
    });
    
    // Profile save button
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', saveProfile);
    }
    
    // Sign out button - with clear debugging
    if (signOutBtn) {
        console.log("Sign out button found");
        signOutBtn.addEventListener('click', () => {
            console.log("Sign out button clicked");
            handleSignOut();
        });
    } else {
        console.error("Sign out button not found in the DOM");
    }
});

// Auth state observer
onAuthStateChanged(auth, (user) => {
    console.log("Auth state changed:", user ? user.email : "No user");
    if (user) {
        currentUser = user;
        console.log("Loading user profile for:", user.uid);
        loadUserProfile();
        loadOrderHistory();
    } else {
        console.log("No user logged in, redirecting to login page");
        window.location.href = 'login.html';
    }
});

// Functions
async function loadUserProfile() {
    console.log("Loading user profile...");
    if (!currentUser) {
        console.error("No current user found");
        return;
    }
    
    console.log("Current user:", currentUser.email);
    
    if (userEmail) {
        userEmail.textContent = currentUser.email;
        console.log("Set user email display to:", currentUser.email);
    } else {
        console.error("userEmail element not found");
    }
    
    if (emailInput) {
        emailInput.value = currentUser.email;
        console.log("Set email input value to:", currentUser.email);
    } else {
        console.error("emailInput not found");
    }
    
    try {
        console.log("Fetching user document from Firestore...");
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        console.log("User document exists:", userDoc.exists());
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log("User data from Firestore:", userData);
            
            if (displayNameInput) {
                displayNameInput.value = userData.displayName || '';
                console.log("Set display name input to:", userData.displayName || '');
            } else {
                console.error("displayNameInput not found");
            }
            
            if (phoneNumberInput) {
                phoneNumberInput.value = userData.phoneNumber || '';
                console.log("Set phone number input to:", userData.phoneNumber || '');
            } else {
                console.error("phoneNumberInput not found");
            }
            
            if (addressInput) {
                addressInput.value = userData.address || '';
                console.log("Set address input to:", userData.address || '');
            } else {
                console.error("addressInput not found");
            }
            
            if (userNameDisplay) {
                userNameDisplay.textContent = userData.displayName || 'User';
                console.log("Set user name display to:", userData.displayName || 'User');
            } else {
                console.error("userNameDisplay not found");
            }
        } else {
            console.warn("User document doesn't exist in Firestore, creating a new one.");
            // If user document doesn't exist, create it with basic info
            await setDoc(doc(db, 'users', currentUser.uid), {
                uid: currentUser.uid,
                displayName: currentUser.displayName || '',
                email: currentUser.email,
                createdAt: new Date()
            });
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
        showMessage('Error loading profile: ' + error.message, true);
    }
}

async function loadOrderHistory() {
    if (!currentUser || !ordersList) {
        console.log("Cannot load orders: missing user or ordersList element");
        return;
    }
    
    try {
        console.log("Fetching orders for user:", currentUser.uid);
        const ordersRef = collection(db, "orders");
        const q = query(
            ordersRef, 
            where("userId", "==", currentUser.uid), 
            orderBy("createdAt", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            console.log("No orders found for user");
            ordersList.innerHTML = '<p class="no-orders">No orders found.</p>';
            return;
        }
        
        console.log(`Found ${querySnapshot.size} orders`);
        ordersList.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const order = doc.data();
            const orderElement = document.createElement('div');
            orderElement.className = 'order-item';
            
            // Format date safely
            let dateString = 'Unknown date';
            if (order.createdAt) {
                // Handle both Firestore timestamp and regular timestamp
                const timestamp = order.createdAt.toDate ? 
                    order.createdAt.toDate() : 
                    new Date(order.createdAt.seconds ? order.createdAt.seconds * 1000 : order.createdAt);
                
                try {
                    dateString = timestamp.toLocaleDateString();
                } catch (e) {
                    console.error("Error formatting date:", e);
                }
            }
            
            // Format order items safely
            let itemsHTML = '';
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    const quantity = item.quantity || 1;
                    const price = item.price || 0;
                    const total = (price * quantity).toFixed(2);
                    
                    itemsHTML += `<div class="order-item-row">
                        <span>${item.name || 'Unknown item'} x${quantity}</span>
                        <span>ALL ${total}</span>
                    </div>`;
                });
            } else {
                itemsHTML = '<div class="order-item-row">No items information available</div>';
            }
            
            // Get order status with fallback
            const status = order.status || 'Pending';
            const statusClass = status.toLowerCase();
            
            // Get total with fallback
            const totalAmount = order.totalAmount || 0;
            
            orderElement.innerHTML = `
                <div class="order-header">
                    <span class="order-id">Order #${doc.id.substring(0, 8)}</span>
                    <span class="order-date">${dateString}</span>
                    <span class="order-status ${statusClass}">${status}</span>
                </div>
                <div class="order-items">
                    ${itemsHTML}
                </div>
                <div class="order-total">
                    Total: ALL ${totalAmount.toFixed(2)}
                </div>
            `;
            
            ordersList.appendChild(orderElement);
        });
        
        console.log("Orders loaded successfully");
        
    } catch (error) {
        console.error('Error loading orders:', error);
        ordersList.innerHTML = '<p class="error-message">Error loading orders. Please try again later.</p>';
    }
}
async function saveProfile() {
    if (!currentUser) return;

    const newEmail = emailInput.value.trim();
    const currentPassword = currentPasswordInput.value;
    const newPassword = newPasswordInput.value;
    
    try {
        // If email is being changed
        if (newEmail !== currentUser.email) {
            if (!currentPassword) {
                showMessage('Current password is required to change email', true);
                return;
            }
            await updateUserEmail(newEmail, currentPassword);
        }

        // If password is being changed
        if (newPassword) {
            if (!currentPassword) {
                showMessage('Current password is required to change password', true);
                return;
            }
            await updateUserPassword(currentPassword, newPassword);
        }

        // Update other profile data
        const userData = {
            displayName: displayNameInput.value,
            phoneNumber: phoneNumberInput.value,
            address: addressInput.value,
            updatedAt: new Date()
        };

        await setDoc(doc(db, 'users', currentUser.uid), userData, { merge: true });
        
        if (userNameDisplay) userNameDisplay.textContent = userData.displayName || 'User';
        showMessage('Profile updated successfully!');
        
        if (currentPasswordInput) currentPasswordInput.value = '';
        if (newPasswordInput) newPasswordInput.value = '';
        
    } catch (error) {
        console.error('Error saving profile:', error);
        showMessage(error.message || 'Error updating profile', true);
    }
}

async function updateUserEmail(newEmail, currentPassword) {
    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
    await reauthenticateWithCredential(currentUser, credential);
    await updateEmail(currentUser, newEmail);
    if (userEmail) userEmail.textContent = newEmail;
}

async function updateUserPassword(currentPassword, newPassword) {
    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
    await reauthenticateWithCredential(currentUser, credential);
    await updatePassword(currentUser, newPassword);
}

async function handleSignOut() {
    console.log("Signing out user...");
    try {
        await signOut(auth);
        console.log("User signed out successfully");
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error signing out:', error);
        showMessage('Error signing out', true);
    }
}

function showMessage(message, isError = false) {
    // Check if a message already exists and remove it
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isError ? 'error' : 'success'}`;
    messageDiv.textContent = message;
    
    const container = document.querySelector('.profile-form');
    if (container && saveProfileBtn) {
        container.insertBefore(messageDiv, saveProfileBtn);
    } else {
        document.body.appendChild(messageDiv);
    }
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

function switchTab(tabId) {
    // Remove active class from all tabs and contents
    profileTabs.forEach(tab => tab.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Add active class to the selected tab and content
    document.querySelector(`.profile-tab[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(`${tabId}Tab`).classList.add('active');
}

// Helper function to debug DOM elements
function debugDOMElements() {
    console.log("============ DOM ELEMENTS DEBUG ============");
    console.log("userNameDisplay:", userNameDisplay ? "FOUND" : "NOT FOUND");
    console.log("userEmail:", userEmail ? "FOUND" : "NOT FOUND");
    console.log("emailInput:", emailInput ? "FOUND" : "NOT FOUND");
    console.log("displayNameInput:", displayNameInput ? "FOUND" : "NOT FOUND");
    console.log("phoneNumberInput:", phoneNumberInput ? "FOUND" : "NOT FOUND");
    console.log("addressInput:", addressInput ? "FOUND" : "NOT FOUND");
    console.log("saveProfileBtn:", saveProfileBtn ? "FOUND" : "NOT FOUND");
    console.log("signOutBtn:", signOutBtn ? "FOUND" : "NOT FOUND");
    console.log("profileTabs count:", profileTabs ? profileTabs.length : "NOT FOUND");
    console.log("tabContents count:", tabContents ? tabContents.length : "NOT FOUND");
    console.log("ordersList:", ordersList ? "FOUND" : "NOT FOUND");
    console.log("=========================================");
}

console.log("Profile page script loaded"); 



