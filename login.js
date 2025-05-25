// login.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Your web app's Firebase configuration (SAME AS IN register.js)
const firebaseConfig = {
  apiKey: "AIzaSyCx5tv97A5GBce-iOECUYs_3G_IIm9TKB0", // Replace with your actual API key
  authDomain: "lecoindoux-6fda5.firebaseapp.com",
  projectId: "lecoindoux-6fda5",
  storageBucket: "lecoindoux-6fda5.appspot.com",
  messagingSenderId: "945779817294",
  appId: "1:945779817294:web:aa4940fbeee23e69d8fc1f",
  measurementId: "G-ZNYERDRF1T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // Initialize auth ONCE after initializing app

// Get DOM elements
const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const errorMessageDiv = document.getElementById("error-message");

// Listen for form submission
if (loginForm) { // Good practice to check if the element exists
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault(); // Prevent default form submission (page reload)

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Clear previous error messages
        errorMessageDiv.textContent = "";
        errorMessageDiv.style.color = "red"; // Default error color

        if (!email || !password) {
            errorMessageDiv.textContent = "Ju lutem shkruani email-in dhe fjalëkalimin.";
            return;
        }

        try {
            // Sign in user with email and password
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            console.log("User logged in successfully on login.js:", user.email);

            // Display success message (optional)
            errorMessageDiv.textContent = "Hyrja u krye me sukses! Duke ju ridrejtuar...";
            errorMessageDiv.style.color = "green";

            // Redirect to index.html after a short delay
            setTimeout(() => {
                window.location.href = "index.html"; // Always redirect to home page
            }, 1500); // 0.5 seconds delay

        } catch (error) {
            console.error("Error during login on login.js:", error);
            let friendlyMessage = "Hyrja dështoi. Ju lutem kontrolloni kredencialet tuaja dhe provoni përsëri.";
            if (error.code) {
                switch (error.code) {
                    case "auth/invalid-email":
                        friendlyMessage = "Formati i email-it nuk është i vlefshëm.";
                        break;
                    case "auth/user-not-found":
                    case "auth/wrong-password":
                    case "auth/invalid-credential":
                        friendlyMessage = "Email ose fjalëkalim i pasaktë.";
                        break;
                    case "auth/user-disabled":
                        friendlyMessage = "Llogaria juaj është çaktivizuar.";
                        break;
                    case "auth/too-many-requests":
                        friendlyMessage = "Shumë përpjekje për hyrje. Ju lutem provoni përsëri më vonë ose rivendosni fjalëkalimin tuaj.";
                        break;
                    default:
                        friendlyMessage = `Gabim: ${error.message}`;
                }
            }
            errorMessageDiv.textContent = friendlyMessage;
        }
    });
} else {
    console.error("Login form not found on this page.");
}